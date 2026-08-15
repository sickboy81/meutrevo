import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Context = { params: Promise<{ shareCode: string }> };

function parseGames(value: unknown) {
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

export async function GET(_request: Request, { params }: Context) {
  const { shareCode } = await params;
  const normalizedCode = shareCode.trim().toLowerCase();
  if (!/^[a-z0-9_-]{6,40}$/.test(normalizedCode)) {
    return NextResponse.json({ error: 'Link de bolão inválido.' }, { status: 400 });
  }

  try {
    const result = await db.execute({
      sql: `SELECT id, lottery, title, games_json, total_cost, cotas_total,
          cotas_taken, taxa_pct, status, created_at
        FROM boloes
        WHERE share_code = ?
        LIMIT 1`,
      args: [normalizedCode],
    });
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      return NextResponse.json({ error: 'Bolão não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bolao: {
        id: row.id,
        lottery: row.lottery,
        title: row.title,
        games: parseGames(row.games_json),
        totalCost: Number(row.total_cost) || 0,
        quotasTotal: Number(row.cotas_total) || 0,
        quotasTaken: Number(row.cotas_taken) || 0,
        organizationFee: Number(row.taxa_pct) || 0,
        status: row.status,
        createdAt: row.created_at,
        shareCode: normalizedCode,
      },
      privacy: 'Este resumo não expõe o criador nem os participantes.',
    });
  } catch (error) {
    console.error('Public pool GET error:', error);
    return NextResponse.json({ error: 'Não foi possível carregar este bolão.' }, { status: 500 });
  }
}
