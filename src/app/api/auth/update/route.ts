import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { hashPassword, signToken } from '../../../../lib/auth-utils';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';
import { isValidCpfCnpj, normalizeCpfCnpj } from '../../../../lib/br-documents';
import { sanitize } from '../../../../lib/sanitize';
import { validateBody } from '../../../../lib/validate';
import { updateSchema } from '../../../../schemas/auth';

async function ensureUserProfileColumns() {
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
}

export async function POST(request: Request) {
  try {
    await ensureUserProfileColumns();
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const body = await request.json();
    const validation = validateBody(updateSchema, body);
    if (validation.error) return validation.error;

    const { name, password, avatar, favorite_lottery, cpf_cnpj, city, state } =
      validation.data!;

    const updates: string[] = [];
    const args: string[] = [];

    if (typeof name === 'string' && name.trim()) {
      updates.push('name = ?');
      args.push(sanitize(name.trim()));
    }

    if (typeof password === 'string' && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'A nova senha deve conter no mínimo 6 caracteres' },
          { status: 400 }
        );
      }
      if (password.length > 128) {
        return NextResponse.json(
          { error: 'A nova senha deve conter no máximo 128 caracteres' },
          { status: 400 }
        );
      }
      updates.push('password = ?');
      args.push(hashPassword(password));
    }

    if (typeof avatar === 'string') {
      updates.push('avatar = ?');
      args.push(avatar);
    }

    if (typeof favorite_lottery === 'string') {
      updates.push('favorite_lottery = ?');
      args.push(favorite_lottery);
    }

    if (typeof cpf_cnpj === 'string') {
      const normalizedCpfCnpj = normalizeCpfCnpj(cpf_cnpj);
      if (!normalizedCpfCnpj || !isValidCpfCnpj(normalizedCpfCnpj)) {
        return NextResponse.json(
          { error: 'CPF/CNPJ inválido' },
          { status: 400 }
        );
      }
      updates.push('cpf_cnpj = ?');
      args.push(normalizedCpfCnpj);
    }

    if (typeof city === 'string' && city.trim()) {
      updates.push('city = ?');
      args.push(sanitize(city.trim()));
    }

    if (typeof state === 'string' && state.trim()) {
      updates.push('state = ?');
      args.push(state.trim().toUpperCase());
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    args.push(user.id);
    await db.execute({
      sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    // Query updated user details
    const res = await db.execute({
      sql: 'SELECT role, name, email, avatar, favorite_lottery, cpf_cnpj, city, state FROM users WHERE id = ? LIMIT 1',
      args: [user.id],
    });

    const dbUser = res.rows[0];
    const updatedName = dbUser.name as string;
    const updatedEmail = dbUser.email as string;
    const updatedRole = dbUser.role as string;
    const updatedAvatar = dbUser.avatar as string;
    const updatedFavoriteLottery = dbUser.favorite_lottery as string;
    const updatedCpfCnpj = dbUser.cpf_cnpj as string | undefined;
    const updatedCity = dbUser.city as string | undefined;
    const updatedState = dbUser.state as string | undefined;

    // Issue updated token
    const token = signToken({
      id: user.id,
      email: updatedEmail,
      name: updatedName,
      role: updatedRole,
    });

    const nextResponse = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: updatedEmail,
        name: updatedName,
        role: updatedRole,
        avatar: updatedAvatar,
        favorite_lottery: updatedFavoriteLottery,
        cpf_cnpj: updatedCpfCnpj || '',
        city: updatedCity || '',
        state: updatedState || '',
      },
    });

    nextResponse.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return nextResponse;
  } catch (err: unknown) {
    return internalServerError('Profile update error:', err);
  }
}
