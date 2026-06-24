import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  createRateLimitExceededResponse,
  type RateLimitConfig,
} from '@/lib/rate-limit';
import crypto from 'crypto';
import { verifyToken } from '@/lib/auth-utils';

const AUTH_BURST_LIMIT: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };
const AUTH_SESSION_LIMIT: RateLimitConfig = {
  maxRequests: 12,
  windowMs: 5 * 60_000,
};
const PAYMENT_LIMIT: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 };
const PAYMENT_STATUS_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};
const ADMIN_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 60_000 };
const AUTH_ME_LIMIT: RateLimitConfig = { maxRequests: 180, windowMs: 60_000 };
const USER_DATA_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };
const PUBLIC_DATA_LIMIT: RateLimitConfig = {
  maxRequests: 90,
  windowMs: 60_000,
};
const DEFAULT_API_LIMIT: RateLimitConfig = {
  maxRequests: 40,
  windowMs: 60_000,
};
const APP_LOGIN_PATH = '/login';

function getRateLimitConfig(
  pathname: string,
  method: string
): RateLimitConfig | null {
  if (pathname === '/api/health') return null;

  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/recover' ||
    pathname === '/api/auth/reset'
  ) {
    return AUTH_BURST_LIMIT;
  }

  if (pathname === '/api/auth/me') {
    return AUTH_ME_LIMIT;
  }

  if (pathname.startsWith('/api/auth/')) {
    return AUTH_SESSION_LIMIT;
  }

  if (pathname === '/api/payments/checkout') {
    return PAYMENT_LIMIT;
  }

  if (pathname === '/api/payments/status') {
    return PAYMENT_STATUS_LIMIT;
  }

  if (
    pathname === '/api/payments/webhook' ||
    pathname === '/api/payments/stripe/webhook'
  ) {
    return ADMIN_LIMIT;
  }

  if (pathname.startsWith('/api/admin/')) {
    return ADMIN_LIMIT;
  }

  if (pathname === '/api/config' && method !== 'GET') {
    return ADMIN_LIMIT;
  }

  if (pathname === '/api/loteria' || pathname.startsWith('/api/loteria/')) {
    return PUBLIC_DATA_LIMIT;
  }

  if (
    pathname === '/api/games' ||
    pathname === '/api/simulations' ||
    pathname === '/api/bets' ||
    pathname === '/api/config'
  ) {
    return USER_DATA_LIMIT;
  }

  return DEFAULT_API_LIMIT;
}

// Rotas de API que requerem autenticação
const PROTECTED_API_ROUTES = [
  '/api/auth/me',
  '/api/auth/update',
  '/api/auth/delete',
  '/api/games',
  '/api/bets',
  '/api/simulations',
];

function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('token')?.value ?? null;
}

// ── CSRF: Double Submit Cookie Pattern ──
// Rotas que precisam de proteção CSRF (mutações)
const CSRF_PROTECTED_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/update',
  '/api/auth/delete',
  '/api/auth/reset',
  '/api/games',
  '/api/bets',
  '/api/simulations',
  '/api/payments/checkout',
  '/api/config',
];

function verifyCsrfToken(request: NextRequest): boolean {
  const csrfCookie = request.cookies.get('csrf_token')?.value;
  const csrfHeader = request.headers.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader) return false;

  // Comparação em tempo constante para prevenir timing attacks
  try {
    const cookieBuf = Buffer.from(csrfCookie, 'hex');
    const headerBuf = Buffer.from(csrfHeader, 'hex');
    if (cookieBuf.length !== headerBuf.length) return false;
    return crypto.timingSafeEqual(cookieBuf, headerBuf);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();
  const token = getTokenFromRequest(request);
  const authUser = token ? verifyToken(token) : null;

  if (pathname === '/app' && !authUser) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = APP_LOGIN_PATH;
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete('token');
    }
    return response;
  }

  if (pathname === APP_LOGIN_PATH && authUser) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = '/app';
    appUrl.search = '';
    return NextResponse.redirect(appUrl);
  }

  // ── CSRF Protection ──
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const needsCsrf = CSRF_PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + '?')
    );

    if (needsCsrf && token) {
      if (!verifyCsrfToken(request)) {
        return NextResponse.json(
          { error: 'Token CSRF inválido' },
          { status: 403 }
        );
      }
    }
  }

  // ── Auth protection para rotas de API ──
  for (const route of PROTECTED_API_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '?')) {
      if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
    }
  }

  // ── Rate limiting ──
  const config = getRateLimitConfig(pathname, method);

  if (config) {
    const scopedKeyOptions =
      pathname.startsWith('/api/admin/') ||
      (pathname === '/api/config' && method !== 'GET')
        ? { scope: 'admin-route', userId: authUser?.id ?? null }
        : pathname === '/api/payments/checkout' ||
            pathname === '/api/bets' ||
            pathname === '/api/games' ||
            pathname === '/api/simulations' ||
            pathname === '/api/auth/me'
          ? { scope: 'user-route', userId: authUser?.id ?? null }
          : pathname.startsWith('/api/auth/') && authUser?.id
            ? { scope: 'auth-session', userId: authUser.id }
            : { scope: 'route' };

    const result = await consumeRateLimit(request, config, scopedKeyOptions);
    if (result.blocked) {
      return createRateLimitExceededResponse(result);
    }

    const response = NextResponse.next();
    applyRateLimitHeaders(response.headers, result);

    // Security headers
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // CSRF: setar cookie se não existe
    if (!request.cookies.get('csrf_token')) {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      response.cookies.set('csrf_token', csrfToken, {
        httpOnly: false, // Precisa ser acessível via JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600, // 1 hora
      });
    }

    return response;
  }

  // ── Security headers mesmo sem rate limit ──
  const response = NextResponse.next();
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/app', '/login'],
};
