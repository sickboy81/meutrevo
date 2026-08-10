import { NextResponse } from 'next/server';
import { internalServerError } from '@/lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';
import { validateBody } from '@/lib/validate';
import { loginSchema } from '@/schemas/auth';
import { getSupabaseAuth } from '@/lib/supabase-auth';
import { setSupabaseSessionCookies } from '@/lib/supabase-session';

export async function POST(request: Request) {
  try {
    const validation = validateBody(loginSchema, await request.json());
    if (validation.error) return validation.error;
    const { email, password } = validation.data!;
    const normalizedEmail = email.trim().toLowerCase();
    const limit = await consumeRateLimit(
      request,
      { maxRequests: 5, windowMs: 10 * 60_000 },
      { scope: 'login-email-ip', identifier: normalizedEmail }
    );
    if (limit.blocked)
      return createRateLimitExceededResponse(
        limit,
        'Muitas tentativas para este login. Aguarde antes de tentar novamente.'
      );

    const auth = getSupabaseAuth();
    if (!auth)
      return NextResponse.json(
        { error: 'Supabase Auth não configurado' },
        { status: 503 }
      );
    const { data, error } = await auth.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error || !data.session || !data.user)
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );

    const response = NextResponse.json({
      success: true,
      user: { id: data.user.id, email: normalizedEmail },
    });
    setSupabaseSessionCookies(response, data.session);
    return response;
  } catch (error) {
    return internalServerError('Login error:', error);
  }
}
