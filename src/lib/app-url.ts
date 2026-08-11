const PRODUCTION_APP_URL = 'https://www.meutrevo.com';

function cleanAppUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function getAppUrl(request?: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl?.trim()) return cleanAppUrl(configuredUrl);

  if (process.env.VERCEL_ENV === 'production') {
    return PRODUCTION_APP_URL;
  }

  if (request) return new URL(request.url).origin;
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_APP_URL
    : 'http://localhost:3000';
}

export function getAuthRedirectUrl(path: string, request?: Request): string {
  return new URL(path, getAppUrl(request)).toString();
}
