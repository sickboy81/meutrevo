import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireAuthenticatedUser } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const status = new URL(request.url).searchParams.get('status');
    const statusFilter =
      status && ['pending', 'checked', 'winner', 'cancelled'].includes(status)
        ? 'AND gs.status = ?'
        : '';
    const args: unknown[] = [user.id];
    if (statusFilter) args.push(status);
    const result = await db.execute({
      sql: `SELECT gs.*, gp.title AS plan_title, pg.numbers
            FROM game_schedules gs
            JOIN plan_games pg ON pg.id = gs.plan_game_id
            JOIN game_plans gp ON gp.id = pg.plan_id
            WHERE gs.user_id = ? ${statusFilter}
            ORDER BY gs.contest_num ASC, gs.created_at DESC`,
      args,
    });
    return NextResponse.json({ success: true, schedules: result.rows });
  } catch (error) {
    return internalServerError('Schedules list error:', error);
  }
}
