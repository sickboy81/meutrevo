import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const ACCESS_COOKIE = 'sb-access-token';
export const REFRESH_COOKIE = 'sb-refresh-token';

function getClient(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}),
  });
}

export async function getSupabaseSessionUser() {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;
  const client = getClient(accessToken);
  if (!client) return null;
  const current = await client.auth.getUser();
  if (current.data.user) return current.data.user;

  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const refreshClient = getClient();
  if (!refreshClient) return null;
  const refreshed = await refreshClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!refreshed.data.session?.user) return null;
  store.set(ACCESS_COOKIE, refreshed.data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
  store.set(REFRESH_COOKIE, refreshed.data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return refreshed.data.session.user;
}

export async function getSupabaseAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value || null;
}

export function setSupabaseSessionCookies(
  response: {
    cookies: {
      set: (
        name: string,
        value: string,
        options: Record<string, unknown>
      ) => void;
    };
  },
  session: { access_token: string; refresh_token: string }
) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}
