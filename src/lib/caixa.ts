type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
};

const CAIXA_API_BASE = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
const CAIXA_PORTAL_BASE = 'https://loterias.caixa.gov.br';

const CAIXA_API_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: `${CAIXA_PORTAL_BASE}/`,
  Origin: CAIXA_PORTAL_BASE,
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
} as const;

const CAIXA_PAGE_HEADERS = {
  'User-Agent': CAIXA_API_HEADERS['User-Agent'],
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': CAIXA_API_HEADERS['Accept-Language'],
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
} as const;

const CAIXA_PAGE_BY_LOTTERY: Record<string, string> = {
  megasena: '/Paginas/Mega-Sena.aspx',
  lotofacil: '/Paginas/Lotofacil.aspx',
  quina: '/Paginas/Quina.aspx',
  lotomania: '/Paginas/Lotomania.aspx',
  maismilionaria: '/Paginas/Mais-Milionaria.aspx',
  duplasena: '/Paginas/Dupla-Sena.aspx',
  diadesorte: '/Paginas/Dia-de-Sorte.aspx',
  timemania: '/Paginas/Timemania.aspx',
  supersete: '/Paginas/Super-Sete.aspx',
};

function getSetCookieHeader(response: Response): string | null {
  const withGetSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof withGetSetCookie.getSetCookie === 'function') {
    const cookies = withGetSetCookie
      .getSetCookie()
      .map((value) => value.split(';', 1)[0])
      .filter(Boolean);
    return cookies.length > 0 ? cookies.join('; ') : null;
  }

  return null;
}

async function fetchCaixaJson(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 12000
): Promise<LotteryApiData | null> {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Caixa API status ${response.status}`);
  }

  const data = (await response.json()) as LotteryApiData;
  if (!data?.numero) {
    throw new Error('Resposta da Caixa sem numero de concurso');
  }

  return data;
}

export async function fetchOfficialLotteryResult(
  lotteryId: string,
  contestNum?: number
): Promise<LotteryApiData | null> {
  const apiUrl = contestNum
    ? `${CAIXA_API_BASE}/${lotteryId}/${contestNum}`
    : `${CAIXA_API_BASE}/${lotteryId}`;

  try {
    return await fetchCaixaJson(apiUrl, { ...CAIXA_API_HEADERS });
  } catch {}

  const pagePath = CAIXA_PAGE_BY_LOTTERY[lotteryId];
  if (!pagePath) {
    return null;
  }

  try {
    const warmupResponse = await fetch(`${CAIXA_PORTAL_BASE}${pagePath}`, {
      headers: CAIXA_PAGE_HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });

    const cookieHeader = getSetCookieHeader(warmupResponse);
    const headers = cookieHeader
      ? { ...CAIXA_API_HEADERS, Cookie: cookieHeader }
      : { ...CAIXA_API_HEADERS };

    return await fetchCaixaJson(apiUrl, headers);
  } catch {
    return null;
  }
}
