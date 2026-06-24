import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthUser, UserRole, verifyToken } from '@/lib/auth-utils';

export function internalServerError(context: string, error: unknown) {
  console.error(context, error);
  return NextResponse.json(
    { error: 'Erro interno no servidor' },
    { status: 500 }
  );
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  if (!tokenCookie) return null;

  return verifyToken(tokenCookie.value);
}

export async function getCurrentUserRole(user: AuthUser): Promise<UserRole> {
  const result = await db.execute({
    sql: 'SELECT role, premium_until FROM users WHERE id = ? LIMIT 1',
    args: [user.id],
  });

  if (result.rows.length === 0) {
    return user.role === 'pro' || user.role === 'admin' ? user.role : 'free';
  }

  const row = result.rows[0];
  const role = (row.role as string) || 'free';
  const premiumUntil = row.premium_until as string | null;

  // Se é PRO mas o premium expirou, reverter para free automaticamente
  if (role === 'pro' && premiumUntil) {
    const expiryDate = new Date(premiumUntil);
    if (expiryDate.getTime() < Date.now()) {
      await db.execute({
        sql: "UPDATE users SET role = 'free' WHERE id = ?",
        args: [user.id],
      });
      return 'free';
    }
  }

  return role === 'pro' || role === 'admin' ? role : 'free';
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
    };
  }

  return { user, response: null };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user) return { user: null, role: null, response };

  const role = await getCurrentUserRole(user);
  if (!allowedRoles.includes(role)) {
    return {
      user,
      role,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }),
    };
  }

  return { user, role, response: null };
}
