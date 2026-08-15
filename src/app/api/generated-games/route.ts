import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { internalServerError, requireAuthenticatedUser } from '@/lib/api-auth';
import {
  analysisSnapshotSchema,
  generatedGameRecordSchema,
  generationSourceSchema,
  gameScoreSchema,
  lotteryIdSchema,
} from '@/schemas/game-intelligence';

const createGeneratedGameSchema = z.object({
  lottery: lotteryIdSchema,
  selectedNumbers: z.array(z.number().int()).min(1).max(50),
  source: generationSourceSchema,
  strategyId: z.string().trim().min(1).max(120).optional(),
  score: gameScoreSchema,
  analysisSnapshot: analysisSnapshotSchema,
});

const listGeneratedGamesSchema = z
  .object({
    lottery: lotteryIdSchema.optional(),
    source: generationSourceSchema.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(500).optional(),
  })
  .superRefine((filters, context) => {
    if (filters.from && filters.to && filters.from > filters.to) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'A data final deve ser posterior a data inicial.',
      });
    }
  });

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().trim().min(1).max(120),
});

type GeneratedGameCursor = z.infer<typeof cursorSchema>;

function invalidDataResponse(details: unknown) {
  return NextResponse.json(
    { error: 'Dados invalidos', details },
    { status: 400 }
  );
}

function decodeCursor(value: string): GeneratedGameCursor | null {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const parsed = cursorSchema.safeParse(JSON.parse(decoded));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function encodeCursor(cursor: GeneratedGameCursor) {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function parseJsonColumn(value: unknown) {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toGeneratedGameRecord(row: Record<string, unknown>) {
  return generatedGameRecordSchema.safeParse({
    id: row.id,
    userId: row.user_id,
    lottery: row.lottery,
    selectedNumbers: parseJsonColumn(row.selected_numbers),
    source: row.source,
    strategyId: row.strategy_id ?? undefined,
    score: parseJsonColumn(row.score_json),
    analysisSnapshot: parseJsonColumn(row.analysis_snapshot),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  });
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidDataResponse({ formErrors: ['JSON invalido'] });
    }

    const parsed = createGeneratedGameSchema.safeParse(body);
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten());

    const now = new Date().toISOString();
    const validatedRecord = generatedGameRecordSchema.safeParse({
      ...parsed.data,
      id: 'validation-only',
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    });
    if (!validatedRecord.success) {
      return invalidDataResponse(validatedRecord.error.flatten());
    }

    const gameId = crypto.randomUUID();
    const game = validatedRecord.data;
    await db.execute({
      sql: `INSERT INTO generated_games
        (id, user_id, lottery, selected_numbers, source, strategy_id, score_json, analysis_snapshot)
        VALUES (?, ?, ?, ?::jsonb, ?, ?, ?::jsonb, ?::jsonb)`,
      args: [
        gameId,
        user.id,
        game.lottery,
        JSON.stringify(game.selectedNumbers),
        game.source,
        game.strategyId ?? null,
        JSON.stringify(game.score),
        JSON.stringify(game.analysisSnapshot),
      ],
    });

    return NextResponse.json({ success: true, gameId }, { status: 201 });
  } catch (error: unknown) {
    return internalServerError('Generated game create error:', error);
  }
}

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = listGeneratedGamesSchema.safeParse(params);
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten());

    const filters = parsed.data;
    const cursor = filters.cursor ? decodeCursor(filters.cursor) : undefined;
    if (filters.cursor && !cursor) {
      return invalidDataResponse({
        fieldErrors: { cursor: ['Cursor invalido'] },
      });
    }

    const conditions = ['user_id = ?'];
    const args: unknown[] = [user.id];
    if (filters.lottery) {
      conditions.push('lottery = ?');
      args.push(filters.lottery);
    }
    if (filters.source) {
      conditions.push('source = ?');
      args.push(filters.source);
    }
    if (filters.from) {
      conditions.push('created_at >= ?::timestamptz');
      args.push(filters.from);
    }
    if (filters.to) {
      conditions.push('created_at <= ?::timestamptz');
      args.push(filters.to);
    }
    if (filters.minScore !== undefined) {
      conditions.push("COALESCE((score_json->>'total')::int, 0) >= ?");
      args.push(filters.minScore);
    }
    if (cursor) {
      conditions.push('(created_at, id) < (?::timestamptz, ?)');
      args.push(cursor.createdAt, cursor.id);
    }

    args.push(filters.limit + 1);
    const result = await db.execute({
      sql: `SELECT id, user_id, lottery, selected_numbers, source, strategy_id,
          score_json, analysis_snapshot, created_at, updated_at
        FROM generated_games
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT ?`,
      args,
    });

    const hasMore = result.rows.length > filters.limit;
    const rows = result.rows.slice(0, filters.limit);
    const games = rows.map(toGeneratedGameRecord);
    const invalidRecord = games.find((game) => !game.success);
    if (invalidRecord && !invalidRecord.success) {
      return internalServerError(
        'Generated game list contains an invalid record:',
        invalidRecord.error
      );
    }

    const records = games.map((game) => {
      if (!game.success) throw new Error('Invalid generated game record');
      return game.data;
    });
    const lastRecord = records.at(-1);

    return NextResponse.json({
      success: true,
      games: records,
      nextCursor:
        hasMore && lastRecord
          ? encodeCursor({
              createdAt: lastRecord.createdAt,
              id: lastRecord.id,
            })
          : null,
    });
  } catch (error: unknown) {
    return internalServerError('Generated game list error:', error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const id = new URL(request.url).searchParams.get('id');
    if (!id || id.length > 120) {
      return invalidDataResponse({ fieldErrors: { id: ['ID invalido'] } });
    }
    const result = await db.execute({
      sql: 'DELETE FROM generated_games WHERE id = ? AND user_id = ?',
      args: [id, user.id],
    });
    if (!result.rowsAffected) {
      return NextResponse.json(
        { error: 'Registro não encontrado.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return internalServerError('Generated game delete error:', error);
  }
}
