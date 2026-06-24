import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';

export async function POST() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    // Delete all user related records
    await db.execute({
      sql: 'DELETE FROM saved_games WHERE user_id = ?',
      args: [user.id],
    });
    await db.execute({
      sql: 'DELETE FROM saved_simulations WHERE user_id = ?',
      args: [user.id],
    });
    await db.execute({
      sql: 'DELETE FROM bets WHERE user_id = ?',
      args: [user.id],
    });
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [user.id],
    });

    // Clear the token cookie
    const cookieStore = await cookies();
    cookieStore.delete('token');

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return internalServerError('Delete account error:', err);
  }
}
