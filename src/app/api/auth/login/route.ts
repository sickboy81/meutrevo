import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth-utils';
import { internalServerError } from '@/lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';
import { validateBody } from '@/lib/validate';
import { loginSchema } from '@/schemas/auth';

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateBody(loginSchema, body);
    if (validation.error) return validation.error;

    const { email, password } = validation.data!;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    const emailLimit = await consumeRateLimit(
      request,
      { maxRequests: 5, windowMs: 10 * 60_000 },
      { scope: 'login-email-ip', identifier: normalizedEmail }
    );
    if (emailLimit.blocked) {
      return createRateLimitExceededResponse(
        emailLimit,
        'Muitas tentativas para este login. Aguarde antes de tentar novamente.'
      );
    }

    const sprayLimit = await consumeRateLimit(
      request,
      { maxRequests: 20, windowMs: 15 * 60_000 },
      { scope: 'login-ip-window' }
    );
    if (sprayLimit.blocked) {
      return createRateLimitExceededResponse(
        sprayLimit,
        'Muitas tentativas de autenticação a partir deste IP. Aguarde antes de tentar novamente.'
      );
    }

    // Buscar usuário no banco
    const res = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Validar senha
    const isValid = verifyPassword(password, user.password as string);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (Number(user.blocked) === 1) {
      return NextResponse.json(
        { error: 'Sua conta está suspensa. Entre em contato com o suporte.' },
        { status: 403 }
      );
    }

    const userId = user.id as string;
    const name = user.name as string;
    const role = (user.role as string) || 'free';

    // Gerar token
    const token = signToken({ id: userId, email: normalizedEmail, name, role });

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: normalizedEmail, name, role },
    });

    // Definir cookie seguro
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    return internalServerError('Login error:', err);
  }
}
