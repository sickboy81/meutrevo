import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  blocked: boolean;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  get(
    key: string
  ): Promise<RateLimitEntry | undefined> | RateLimitEntry | undefined;
  set(key: string, value: RateLimitEntry): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  sweep?(now: number): Promise<void> | void;
  clear?(): Promise<void> | void;
}

export interface RateLimitKeyOptions {
  scope?: string;
  pathname?: string;
  method?: string;
  ip?: string;
  userId?: string | null;
  identifier?: string | null;
  extras?: string[];
}

type RequestLike = Pick<Request, 'headers' | 'url'> & {
  method?: string;
};

const IP_HEADER_CANDIDATES = [
  'cf-connecting-ip',
  'x-forwarded-for',
  'x-real-ip',
  'x-vercel-forwarded-for',
];

class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitEntry>();

  get(key: string) {
    return this.buckets.get(key);
  }

  set(key: string, value: RateLimitEntry) {
    this.buckets.set(key, value);
  }

  delete(key: string) {
    this.buckets.delete(key);
  }

  sweep(now: number) {
    for (const [key, value] of this.buckets.entries()) {
      if (now > value.resetAt) {
        this.buckets.delete(key);
      }
    }
  }

  clear() {
    this.buckets.clear();
  }
}

let activeRateLimitStore: RateLimitStore = new MemoryRateLimitStore();

export function setRateLimitStore(store: RateLimitStore) {
  activeRateLimitStore = store;
}

export function getRateLimitStore() {
  return activeRateLimitStore;
}

export function getClientIp(request: RequestLike): string {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const rawValue = request.headers.get(headerName);
    if (!rawValue) continue;

    const ip = rawValue.split(',')[0]?.trim();
    if (ip) return ip;
  }

  return 'unknown';
}

export function buildRateLimitKey(
  request: RequestLike,
  options: RateLimitKeyOptions = {}
): string {
  const pathname = options.pathname ?? new URL(request.url).pathname;
  const method = options.method ?? request.method?.toUpperCase() ?? 'GET';
  const ip = options.ip ?? getClientIp(request);

  if (
    !options.scope &&
    !options.userId &&
    !options.identifier &&
    !options.extras?.length
  ) {
    return `${ip}:${method}:${pathname}`;
  }

  const parts = [options.scope ?? 'route', ip, method, pathname];

  if (options.userId) {
    parts.push(`user=${options.userId}`);
  }

  if (options.identifier) {
    parts.push(`id=${options.identifier}`);
  }

  if (options.extras?.length) {
    parts.push(...options.extras);
  }

  return parts.join(':');
}

export async function consumeRateLimitByKey(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  await activeRateLimitStore.sweep?.(now);

  const existing = await activeRateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowMs;
    await activeRateLimitStore.set(key, { count: 1, resetAt });
    return {
      key,
      limit: config.maxRequests,
      remaining: Math.max(config.maxRequests - 1, 0),
      resetAt,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      blocked: false,
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      key,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        Math.ceil((existing.resetAt - now) / 1000),
        1
      ),
      blocked: true,
    };
  }

  const nextValue = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  };
  await activeRateLimitStore.set(key, nextValue);

  return {
    key,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - nextValue.count, 0),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
    blocked: false,
  };
}

export async function consumeRateLimit(
  request: RequestLike,
  config: RateLimitConfig,
  options: RateLimitKeyOptions = {}
): Promise<RateLimitResult> {
  return consumeRateLimitByKey(buildRateLimitKey(request, options), config);
}

export async function claimOneTimeToken(
  key: string,
  ttlMs: number
): Promise<boolean> {
  const result = await consumeRateLimitByKey(key, {
    maxRequests: 1,
    windowMs: ttlMs,
  });
  return !result.blocked;
}

export function applyRateLimitHeaders(
  headers: Headers,
  result: Pick<
    RateLimitResult,
    'limit' | 'remaining' | 'resetAt' | 'retryAfterSeconds' | 'blocked'
  >
) {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  if (result.blocked) {
    headers.set('Retry-After', String(result.retryAfterSeconds));
  }
}

export function createRateLimitExceededResponse(
  result: RateLimitResult,
  message = 'Muitas requisições. Tente novamente em alguns segundos.'
) {
  const response = NextResponse.json({ error: message }, { status: 429 });
  applyRateLimitHeaders(response.headers, result);
  return response;
}

export function clearRateLimitStore() {
  return activeRateLimitStore.clear?.();
}
