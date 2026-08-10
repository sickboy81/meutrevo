import { NextResponse } from 'next/server';
import { getSupabaseAuth } from '@/lib/supabase-auth';
import { setSupabaseSessionCookies } from '@/lib/supabase-session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const destination =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  if (!code)
    return NextResponse.redirect(
      new URL('/login?error=link-invalido', url.origin)
    );
  const auth = getSupabaseAuth();
  if (!auth)
    return NextResponse.redirect(
      new URL('/login?error=auth-indisponivel', url.origin)
    );
  const { data, error } = await auth.auth.exchangeCodeForSession(code);
  if (error || !data.session)
    return NextResponse.redirect(
      new URL('/login?error=link-expirado', url.origin)
    );
  const response = NextResponse.redirect(new URL(destination, url.origin));
  setSupabaseSessionCookies(response, data.session);
  return response;
}
