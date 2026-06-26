import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';

async function ensureUserRoleColumns() {
  try {
    await db.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'free'");
  } catch {}
  try {
    await db.execute('ALTER TABLE users ADD COLUMN premium_until DATETIME');
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '👤'");
  } catch {}
  try {
    await db.execute(
      "ALTER TABLE users ADD COLUMN favorite_lottery TEXT DEFAULT 'megasena'"
    );
  } catch {}
  try {
    await db.execute('ALTER TABLE users ADD COLUMN cpf_cnpj TEXT');
  } catch {}
  try {
    await db.execute('ALTER TABLE users ADD COLUMN city TEXT');
  } catch {}
  try {
    await db.execute('ALTER TABLE users ADD COLUMN state TEXT');
  } catch {}
  try {
    await db.execute(
      'ALTER TABLE users ADD COLUMN show_in_ranking INTEGER DEFAULT 1'
    );
  } catch {}
}

export async function GET() {
  await ensureUserRoleColumns();
  try {
    const { user: payload, response } = await requireAuthenticatedUser();
    if (response || !payload) return response;

    // Live query status from database
    const res = await db.execute({
      sql: 'SELECT role, name, avatar, favorite_lottery, cpf_cnpj, premium_until, show_in_ranking, city, state FROM users WHERE id = ? LIMIT 1',
      args: [payload.id],
    });

    const dbUser = res.rows.length > 0 ? res.rows[0] : null;
    const role = dbUser ? (dbUser.role as string) : payload.role;
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
