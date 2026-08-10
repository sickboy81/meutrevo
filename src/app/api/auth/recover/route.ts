import { NextResponse } from 'next/server';
import { internalServerError } from '../../../../lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '../../../../lib/rate-limit';
import { getSupabaseAuth } from '../../../../lib/supabase-auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({ email: '' }));
    const normalizedEmail =
      typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'E-mail inválido ou obrigatório' },
        { status: 400 }
      );
    }
    const limit = await consumeRateLimit(
      request,
      { maxRequests: 2, windowMs: 30 * 60_000 },
      { scope: 'recover-email-ip', identifier: normalizedEmail }
    );
    if (limit.blocked)
      return createRateLimitExceededResponse(
        limit,
        'Muitas solicitações. Aguarde antes de tentar novamente.'
      );
    const auth = getSupabaseAuth();
    if (auth) {
      const { error } = await auth.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: new URL(
          '/auth/callback?next=/reset-password',
          request.url
        ).toString(),
      });
      if (error) console.error('Supabase recovery error:', error.message);
    }
    return NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.',
    });
  } catch (error) {
    return internalServerError('Recovery request error:', error);
  }
}
