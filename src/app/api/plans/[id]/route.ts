import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireAuthenticatedUser } from '@/lib/api-auth';
import { updateGamePlanSchema } from '@/schemas/game-plans';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  void request;
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { id } = await context.params;
    const plan = await db.execute({
      sql: 'SELECT * FROM game_plans WHERE id = ? AND user_id = ? LIMIT 1',
      args: [id, user.id],
    });
    if (!plan.rows.length)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    const games = await db.execute({
      sql: `SELECT pg.*, COALESCE(json_agg(gs ORDER BY gs.contest_num) FILTER (WHERE gs.id IS NOT NULL), '[]') AS schedules
            FROM plan_games pg
            LEFT JOIN game_schedules gs ON gs.plan_game_id = pg.id
            WHERE pg.plan_id = ? AND pg.user_id = ?
            GROUP BY pg.id ORDER BY pg.created_at`,
      args: [id, user.id],
    });
    return NextResponse.json({
      success: true,
      plan: plan.rows[0],
      games: games.rows,
    });
  } catch (error) {
    return internalServerError('Game plan detail error:', error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { id } = await context.params;
    const source = await db.execute({
      sql: 'SELECT * FROM game_plans WHERE id = ? AND user_id = ? LIMIT 1',
      args: [id, user.id],
    });
    if (!source.rows.length)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    const games = await db.execute({
      sql: 'SELECT lottery, numbers, cost, source FROM plan_games WHERE plan_id = ? AND user_id = ? ORDER BY created_at',
      args: [id, user.id],
    });
    const original = source.rows[0];
    const planId = crypto.randomUUID();
    const planGameIds = games.rows.map(() => crypto.randomUUID());
    const contestsCount = Number(original.contests_count || 1);
    const latest = await db.execute({
      sql: 'SELECT COALESCE(MAX(contest_num), 0)::int AS contest FROM lottery_cache WHERE lottery = ?',
      args: [original.lottery],
    });
    const firstContest = Number(latest.rows[0]?.contest || 0) + 1;
    const queries = [
      {
        sql: `INSERT INTO game_plans (id, user_id, title, lottery, budget, contests_count, strategy)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          planId,
          user.id,
          `Cópia de ${original.title}`,
          original.lottery,
          original.budget,
          contestsCount,
          original.strategy,
        ],
      },
      ...games.rows.flatMap((game, index) => {
        const savedGameId = crypto.randomUUID();
        return [
          {
            sql: 'INSERT INTO saved_games (id, user_id, lottery, numbers) VALUES (?, ?, ?, ?)',
            args: [savedGameId, user.id, game.lottery, game.numbers],
          },
          {
            sql: `INSERT INTO plan_games (id, plan_id, user_id, saved_game_id, lottery, numbers, cost, source)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              planGameIds[index],
              planId,
              user.id,
              savedGameId,
              game.lottery,
              game.numbers,
              game.cost,
              game.source,
            ],
          },
          ...Array.from({ length: contestsCount }, (_, contestIndex) => ({
            sql: `INSERT INTO game_schedules (id, plan_game_id, user_id, lottery, contest_num)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
              crypto.randomUUID(),
              planGameIds[index],
              user.id,
              game.lottery,
              firstContest + contestIndex,
            ],
          })),
        ];
      }),
    ];
    await db.batch(queries);
    return NextResponse.json({ success: true, planId }, { status: 201 });
  } catch (error) {
    return internalServerError('Game plan duplicate error:', error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { id } = await context.params;
    const parsed = updateGamePlanSchema.safeParse(await request.json());
    if (!parsed.success || !Object.keys(parsed.data).length) {
      return NextResponse.json(
        { error: 'Atualização inválida' },
        { status: 400 }
      );
    }
    const fields: string[] = [];
    const args: unknown[] = [];
    if (parsed.data.status) {
      fields.push('status = ?');
      args.push(parsed.data.status);
    }
    if (parsed.data.title) {
      fields.push('title = ?');
      args.push(parsed.data.title);
    }
    fields.push('updated_at = now()');
    args.push(id, user.id);
    const result = await db.execute({
      sql: `UPDATE game_plans SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      args,
    });
    if (!result.rowsAffected)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError('Game plan update error:', error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  void request;
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { id } = await context.params;
    const result = await db.batch([
      {
        sql: `DELETE FROM saved_games
              WHERE id IN (SELECT saved_game_id FROM plan_games WHERE plan_id = ? AND user_id = ?)
                AND user_id = ?`,
        args: [id, user.id, user.id],
      },
      {
        sql: 'DELETE FROM game_plans WHERE id = ? AND user_id = ?',
        args: [id, user.id],
      },
    ]);
    if (!result[1]?.rowsAffected)
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError('Game plan delete error:', error);
  }
}
