/**
 * Wrapper de fetch que automaticamente adiciona o header CSRF token
 * em requisições mutáveis (POST, PUT, DELETE, PATCH).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export async function fetchWithCsrf(
  url: string | URL | Request,
  init?: RequestInit,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
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

  const controller = new AbortController();
  const sourceSignal = init?.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else {
    sourceSignal?.addEventListener('abort', abortFromSource, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
}
