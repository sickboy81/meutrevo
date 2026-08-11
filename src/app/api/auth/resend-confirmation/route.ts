import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/supabase-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';
import { recoverSchema } from '@/schemas/auth';
import { getAuthRedirectUrl } from '@/lib/app-url';

export async function POST(request: Request) {
  const parsed = recoverSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success)
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const limit = await consumeRateLimit(
    request,
    { maxRequests: 3, windowMs: 15 * 60_000 },
    { scope: 'resend-confirmation-ip', identifier: email }
  );
  if (limit.blocked)
    return createRateLimitExceededResponse(
      limit,
      'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.'
    );

  const auth = getSupabaseAuth();
  if (!auth)
    return NextResponse.json(
      { error: 'Supabase Auth não configurado' },
      { status: 503 }
    );

  const { error } = await auth.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl('/auth/callback?next=/app', request),
    },
  });

  // Keep the response generic so the endpoint cannot be used to enumerate users.
  if (error)
    return NextResponse.json({
      success: true,
      message:
        'Se o cadastro estiver pendente, um novo e-mail de confirmação foi enviado.',
    });

  return NextResponse.json({
    success: true,
    message:
      'Novo e-mail de confirmação enviado. Verifique também a pasta de spam.',
  });
}
