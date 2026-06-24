/**
 * Wrapper de fetch que automaticamente adiciona o header CSRF token
 * em requisições mutáveis (POST, PUT, DELETE, PATCH).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchWithCsrf(
  url: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      const headers = new Headers(init?.headers);
      headers.set('x-csrf-token', csrfToken);
      init = { ...init, headers };
    }
  }

  return fetch(url, init);
}
