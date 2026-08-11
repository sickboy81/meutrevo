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
    { scope: 'magic-link-ip', identifier: email }
  );
  if (limit.blocked)
    return createRateLimitExceededResponse(
      limit,
      'Muitas solicitações. Aguarde antes de tentar novamente.'
    );
  const auth = getSupabaseAuth();
  if (!auth)
    return NextResponse.json(
      { error: 'Supabase Auth não configurado' },
      { status: 503 }
    );
  const { error } = await auth.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: getAuthRedirectUrl('/auth/callback?next=/app', request),
    },
  });
  if (error)
    return NextResponse.json(
      { error: 'Não foi possível enviar o link de acesso.' },
      { status: 400 }
    );
  return NextResponse.json({
    success: true,
    message: 'Link mágico enviado. Verifique seu e-mail para entrar.',
  });
}
