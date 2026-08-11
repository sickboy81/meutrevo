import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';
import { isAdminEmail } from '../../../../lib/admin';

export async function GET() {
  try {
    const { user: payload, response } = await requireAuthenticatedUser();
    if (response || !payload) return response;

    // Live query status from database
    const res = await db.execute({
      sql: 'SELECT role, name, avatar, favorite_lottery, cpf_cnpj, premium_until, show_in_ranking, city, state FROM users WHERE id = ? LIMIT 1',
      args: [payload.id],
    });

    const dbUser = res.rows.length > 0 ? res.rows[0] : null;
    const role = isAdminEmail(payload.email)
      ? 'admin'
      : dbUser
        ? (dbUser.role as string)
        : payload.role;
    const name = dbUser ? (dbUser.name as string) : payload.name;
    const avatar = dbUser && dbUser.avatar ? (dbUser.avatar as string) : '👤';
    const favorite_lottery =
      dbUser && dbUser.favorite_lottery
        ? (dbUser.favorite_lottery as string)
        : 'megasena';
    const cpf_cnpj =
      dbUser && dbUser.cpf_cnpj ? (dbUser.cpf_cnpj as string) : '';
    const premium_until =
      dbUser && dbUser.premium_until ? (dbUser.premium_until as string) : null;
    const show_in_ranking = !dbUser || (dbUser.show_in_ranking as number) !== 0;
    const city = dbUser && dbUser.city ? (dbUser.city as string) : '';
    const state = dbUser && dbUser.state ? (dbUser.state as string) : '';

    return NextResponse.json({
      success: true,
      user: {
        id: payload.id,
        email: payload.email,
        name,
        role,
        avatar,
        favorite_lottery,
        cpf_cnpj,
        premium_until,
        show_in_ranking,
        city,
        state,
      },
    });
  } catch (err: unknown) {
    return internalServerError('Auth me error:', err);
  }
}
