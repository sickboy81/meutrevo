import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireAuthenticatedUser } from '@/lib/api-auth';
import { createGamePlanSchema } from '@/schemas/game-plans';
import { calculateGamePlanCost } from '@/lib/game-plan-cost';

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const plans = await db.execute({
      sql: `SELECT p.*, COUNT(DISTINCT pg.id)::int AS games_count,
            COUNT(DISTINCT CASE WHEN gs.status = 'pending' THEN gs.id END)::int AS pending_count,
            MIN(CASE WHEN gs.status = 'pending' THEN gs.contest_num END)::int AS next_contest
            FROM game_plans p
            LEFT JOIN plan_games pg ON pg.plan_id = p.id
            LEFT JOIN game_schedules gs ON gs.plan_game_id = pg.id
            WHERE p.user_id = ?
            GROUP BY p.id
            ORDER BY p.created_at DESC`,
      args: [user.id],
    });
    return NextResponse.json({ success: true, plans: plans.rows });
  } catch (error) {
    return internalServerError('Game plans list error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const parsed = createGamePlanSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados do plano inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, lottery, budget, contestsCount, strategy, games } =
      parsed.data;
    const minimumBudget = calculateGamePlanCost(
      lottery,
      games.length,
      contestsCount
    ).total;
    if (budget < minimumBudget) {
      return NextResponse.json(
        {
          error: `O orçamento mínimo para este plano é R$ ${minimumBudget.toFixed(2).replace('.', ',')}.`,
        },
        { status: 400 }
      );
    }
    const planId = crypto.randomUUID();
    const latest = await db.execute({
      sql: 'SELECT COALESCE(MAX(contest_num), 0)::int AS contest FROM lottery_cache WHERE lottery = ?',
      args: [lottery],
    });
    const firstContest = Number(latest.rows[0]?.contest || 0) + 1;
    const planGameIds = games.map(() => crypto.randomUUID());
    const savedGameIds = games.map(() => crypto.randomUUID());
    const totalScheduledGames = games.length * contestsCount;
    const costPerScheduledGame = totalScheduledGames
      ? budget / totalScheduledGames
      : 0;
    const queries = [
      {
        sql: `INSERT INTO game_plans
          (id, user_id, title, lottery, budget, contests_count, strategy)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          planId,
          user.id,
          title,
          lottery,
          budget,
          contestsCount,
          strategy,
        ],
      },
      ...games.map((numbers, index) => ({
        sql: `INSERT INTO saved_games (id, user_id, lottery, numbers) VALUES (?, ?, ?, ?)`,
        args: [
          savedGameIds[index],
          user.id,
          lottery,
          JSON.stringify(
            numbers.map((number) => String(number).padStart(2, '0'))
          ),
        ],
      })),
      ...games.map((numbers, index) => ({
        sql: `INSERT INTO plan_games
          (id, plan_id, user_id, lottery, numbers, cost, source)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          planGameIds[index],
          planId,
          user.id,
          lottery,
          JSON.stringify(
            numbers.map((number) => String(number).padStart(2, '0'))
          ),
          costPerScheduledGame,
          strategy === 'random' ? 'random' : 'generator',
        ],
      })),
      ...planGameIds.map((planGameId, index) => ({
        sql: `UPDATE plan_games SET saved_game_id = ? WHERE id = ? AND user_id = ?`,
        args: [savedGameIds[index], planGameId, user.id],
      })),
      ...planGameIds.flatMap((planGameId) =>
        Array.from({ length: contestsCount }, (_, index) => ({
          sql: `INSERT INTO game_schedules
            (id, plan_game_id, user_id, lottery, contest_num)
            VALUES (?, ?, ?, ?, ?)`,
          args: [
            crypto.randomUUID(),
            planGameId,
            user.id,
            lottery,
            firstContest + index,
          ],
        }))
      ),
    ];
    await db.batch(queries);
    return NextResponse.json({ success: true, planId }, { status: 201 });
  } catch (error) {
    return internalServerError('Game plan create error:', error);
  }
}
