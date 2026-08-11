import { afterEach, describe, expect, it } from 'vitest';
import { getAppUrl, getAuthRedirectUrl } from './app-url';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  process.env.VERCEL_ENV = originalVercelEnv;
});

describe('app URL', () => {
  it('uses the configured canonical URL for auth links', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.meutrevo.com/';
    expect(getAppUrl()).toBe('https://www.meutrevo.com');
    expect(getAuthRedirectUrl('/auth/callback?next=/app')).toBe(
      'https://www.meutrevo.com/auth/callback?next=/app'
    );
  });

  it('uses the production domain when Vercel has no explicit URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = 'production';
    expect(getAppUrl()).toBe('https://www.meutrevo.com');
  });
});
