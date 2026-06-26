import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildRateLimitKey,
  claimOneTimeToken,
  clearRateLimitStore,
  consumeRateLimit,
  getClientIp,
} from '@/lib/rate-limit';

describe('rate limit helper', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('extracts the first forwarded IP', () => {
    const request = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      }),
      url: 'https://www.meutrevo.com/api/auth/login',
      method: 'POST',
    };

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it('tracks requests by ip, method, and route', () => {
    const request = {
      headers: new Headers({
        'x-real-ip': '198.51.100.20',
      }),
      url: 'https://www.meutrevo.com/api/auth/login',
      method: 'POST',
    };

    const key = buildRateLimitKey(request);
    expect(key).toBe('198.51.100.20:POST:/api/auth/login');
  });

  it('blocks when the configured limit is exceeded', async () => {
    const request = {
      headers: new Headers({
        'x-real-ip': '198.51.100.20',
      }),
      url: 'https://www.meutrevo.com/api/auth/login',
      method: 'POST',
    };

    const first = await consumeRateLimit(request, {
      maxRequests: 2,
      windowMs: 60_000,
    });
    const second = await consumeRateLimit(request, {
      maxRequests: 2,
      windowMs: 60_000,
    });
    const third = await consumeRateLimit(request, {
      maxRequests: 2,
      windowMs: 60_000,
    });

    expect(first.blocked).toBe(false);
    expect(first.remaining).toBe(1);
    expect(second.blocked).toBe(false);
    expect(second.remaining).toBe(0);
    expect(third.blocked).toBe(true);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('does not mix buckets from different methods', async () => {
    const baseRequest = {
      headers: new Headers({
        'x-real-ip': '192.0.2.1',
      }),
      url: 'https://www.meutrevo.com/api/config',
    };

    const getResult = await consumeRateLimit(
      { ...baseRequest, method: 'GET' },
      { maxRequests: 1, windowMs: 60_000 }
    );
    const postResult = await consumeRateLimit(
      { ...baseRequest, method: 'POST' },
      { maxRequests: 1, windowMs: 60_000 }
    );

    expect(getResult.blocked).toBe(false);
    expect(postResult.blocked).toBe(false);
  });

  it('supports scoped keys for future shared stores and per-user limits', () => {
    const request = {
      headers: new Headers({
        'x-real-ip': '192.0.2.55',
      }),
      url: 'https://www.meutrevo.com/api/bets',
      method: 'POST',
    };

    const key = buildRateLimitKey(request, {
      scope: 'user-route',
      userId: 'user-123',
    });

    expect(key).toBe('user-route:192.0.2.55:POST:/api/bets:user=user-123');
  });

  it('claims replay tokens only once during the ttl window', async () => {
    const firstClaim = await claimOneTimeToken('webhook:abc', 60_000);
    const secondClaim = await claimOneTimeToken('webhook:abc', 60_000);

    expect(firstClaim).toBe(true);
    expect(secondClaim).toBe(false);
  });
});
