import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

type Context = { params: Promise<{ shareCode: string }> };

function parseGames(value: unknown): string[][] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((game): game is unknown[] => Array.isArray(game))
      .map((game) => game.map(String));
  } catch {
    return [];
  }
}

export async function GET(request: Request, { params }: Context) {
  const { shareCode } = await params;
  const normalizedCode = shareCode.trim().toLowerCase();
  if (!/^[a-z0-9_-]{6,40}$/.test(normalizedCode)) {
    return NextResponse.json({ error: 'Link de bolão inválido.' }, { status: 400 });
  }

  // Rate limit: máximo 30 requisições por IP por hora
  const limit = await consumeRateLimit(
    request,
    { maxRequests: 30, windowMs: 60 * 60_000 },
    { scope: 'bolao-public', pathname: `/api/boloes/public/${normalizedCode}` }
  );
  if (limit.blocked) {
    return createRateLimitExceededResponse(
      limit,
      'Muitas requisições. Tente novamente mais tarde.'
    );
  }

  try {
    const result = await db.execute({
      sql: `SELECT 
          lottery_id,
          lottery_name,
          contest_num,
          games_snapshot,
          cotas,
          taxa,
          summary_text,
          created_at
        FROM bolao_shares
        WHERE share_code = ?
          AND is_active = true
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1`,
      args: [normalizedCode],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      return NextResponse.json({ error: 'Bolão não encontrado.' }, { status: 404 });
    }

    // Apenas dados públicos seguros - NUNCA retornar user_id, email, CPF, tokens
    return NextResponse.json({
      success: true,
      lottery_id: row.lottery_id,
      lottery_name: row.lottery_name,
      contest_num: row.contest_num,
      games: parseGames(row.games_snapshot),
      cotas: Number(row.cotas) || 1,
      taxa: Number(row.taxa) || 0,
      summary: row.summary_text || '',
      created_at: row.created_at,
    });
  } catch (error) {
    console.error('Public share GET error:', error);
    return NextResponse.json({ error: 'Não foi possível carregar este bolão.' }, { status: 500 });
  }
}
