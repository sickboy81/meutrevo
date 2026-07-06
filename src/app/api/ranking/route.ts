import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { mergeWithMockRanking } from '@/lib/mock-ranking';

const ALLOWED_LOTTERIES = new Set([
  'all',
  'megasena',
  'lotofacil',
  'quina',
  'lotomania',
  'maismilionaria',
  'duplasena',
  'diadesorte',
  'timemania',
  'supersete',
]);

// GET: Leaderboard
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedLottery = searchParams.get('lottery') || 'all';
  const lottery = ALLOWED_LOTTERIES.has(requestedLottery)
    ? requestedLottery
    : 'all';
  const period = searchParams.get('period') || 'all';

  try {
    let dateFilter = '';
    let rankingSubqueryDateFilter = '';
    if (period === 'month') {
      dateFilter = "AND r.created_at >= datetime('now', '-30 days')";
      rankingSubqueryDateFilter =
        "AND created_at >= datetime('now', '-30 days')";
    } else if (period === 'week') {
      dateFilter = "AND r.created_at >= datetime('now', '-7 days')";
      rankingSubqueryDateFilter =
        "AND created_at >= datetime('now', '-7 days')";
    }

    const rankingLotteryFilter = lottery !== 'all' ? 'AND r.lottery = ?' : '';
    const betsLotteryFilter = lottery !== 'all' ? 'AND lottery = ?' : '';
    const rankingArgs = lottery !== 'all' ? [lottery] : [];

    const result = await db.execute({
      sql: `
        SELECT
          u.name,
          u.id as user_id,
          (SELECT COUNT(*) FROM bets WHERE user_id = u.id) as total_bets,
          COALESCE(SUM(r.hits), 0) as total_hits,
          COALESCE(MAX(r.hits), 0) as best_hit,
          COALESCE((SELECT SUM(prize_won) FROM bets WHERE user_id = u.id), 0) as total_prize,
          CASE WHEN COUNT(r.id) > 0 THEN ROUND(SUM(r.hits) * 1.0 / COUNT(r.id), 1) ELSE 0 END as avg_hits
        FROM users u
        LEFT JOIN rankings r ON r.user_id = u.id ${rankingLotteryFilter} ${dateFilter}
        WHERE (u.show_in_ranking IS NULL OR u.show_in_ranking = 1)
        GROUP BY u.id
        HAVING total_hits > 0
        ORDER BY total_hits DESC, total_prize DESC
        LIMIT 50
      `,
      args: rankingArgs,
    });

    let userPosition: Record<string, unknown> | null = null;
    const user = await getAuthenticatedUser();
    if (user) {
      // Combine data from both bets (total count + prize) and rankings (hits)
      const userStats = await db.execute({
        sql: `
          SELECT
            (SELECT COUNT(*) FROM bets WHERE user_id = ? ${betsLotteryFilter}) as total_bets,
            COALESCE((SELECT SUM(hits) FROM rankings WHERE user_id = ? ${lottery !== 'all' ? 'AND lottery = ?' : ''} ${rankingSubqueryDateFilter}), 0) as total_hits,
            COALESCE((SELECT MAX(hits) FROM rankings WHERE user_id = ? ${lottery !== 'all' ? 'AND lottery = ?' : ''} ${rankingSubqueryDateFilter}), 0) as best_hit,
            COALESCE((SELECT SUM(prize_won) FROM bets WHERE user_id = ? ${betsLotteryFilter}), 0) as total_prize
        `,
        args: [
          user.id,
          ...(lottery !== 'all' ? [lottery] : []),
          user.id,
          ...(lottery !== 'all' ? [lottery] : []),
          user.id,
          ...(lottery !== 'all' ? [lottery] : []),
          user.id,
          ...(lottery !== 'all' ? [lottery] : []),
        ],
      });
      userPosition = userStats.rows[0] || {
        total_bets: 0,
        total_hits: 0,
        best_hit: 0,
        total_prize: 0,
      };
    }

    const realEntries = result.rows.map((row, idx) => ({
      position: idx + 1,
      name: row.name as string,
      user_id: row.user_id as string,
      total_bets: row.total_bets as number,
      total_hits: row.total_hits as number,
      best_hit: row.best_hit as number,
      total_prize: row.total_prize as number,
      avg_hits: row.avg_hits as number,
    }));

    const leaderboard = mergeWithMockRanking(realEntries);

    return NextResponse.json({
      leaderboard,
      user_stats: userPosition,
    });
  } catch (err) {
    console.error('Ranking error:', err);
    return NextResponse.json({ leaderboard: [], user_stats: null });
  }
}

// POST: Record a result for ranking
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    if (user.role === 'free') {
      return NextResponse.json(
        { error: 'Apenas assinantes PRO podem registrar resultados' },
        { status: 403 }
      );
    }

    const { lottery, contest_num, numbers_played, hits, prize_won } =
      await req.json();

    const allowed = [
      'megasena',
      'lotofacil',
      'quina',
      'lotomania',
      'maismilionaria',
      'diadesorte',
      'duplasena',
      'timemania',
    ];
    if (
      !lottery ||
      !contest_num ||
      !numbers_played ||
      !allowed.includes(lottery)
    ) {
      return NextResponse.json(
        { error: 'Dados incompletos ou loteria inválida' },
        { status: 400 }
      );
    }

    const contestNum = Number(contest_num);
    const hitsNum = Number(hits) || 0;
    const prizeNum = Number(prize_won) || 0;

    if (!Number.isFinite(contestNum) || contestNum < 1) {
      return NextResponse.json({ error: 'Concurso inválido' }, { status: 400 });
    }
    if (hitsNum < 0 || hitsNum > 15 || !Number.isFinite(hitsNum)) {
      return NextResponse.json({ error: 'Acertos inválidos' }, { status: 400 });
    }
    if (prizeNum < 0 || prizeNum > 500000000 || !Number.isFinite(prizeNum)) {
      return NextResponse.json({ error: 'Prêmio inválido' }, { status: 400 });
    }

    const id = `rank_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.execute({
      sql: `INSERT INTO rankings (id, user_id, lottery, contest_num, numbers_played, hits, prize_won)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        user.id,
        lottery,
        contestNum,
        numbers_played,
        hitsNum,
        prizeNum,
      ],
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Ranking insert error:', err);
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 });
  }
}

// PATCH: Toggle show_in_ranking
export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { show_in_ranking } = await req.json();
    await db.execute({
      sql: 'UPDATE users SET show_in_ranking = ? WHERE id = ?',
      args: [show_in_ranking ? 1 : 0, user.id],
    });
    return NextResponse.json({
      success: true,
      show_in_ranking: !!show_in_ranking,
    });
  } catch (err) {
    console.error('Ranking toggle error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
