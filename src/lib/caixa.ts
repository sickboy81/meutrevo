type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
  fonteDados?: 'caixa' | 'mirror';
};

type MirrorPrize = {
  descricao?: string;
  faixa?: number;
  ganhadores?: number;
  valorPremio?: number;
};

type MirrorLotteryData = Record<string, unknown> & {
  concurso?: number;
  data?: string;
  local?: string;
  dezenasOrdemSorteio?: string[];
  dezenas?: string[];
  trevos?: string[];
  premiacoes?: MirrorPrize[];
  acumulou?: boolean;
  proximoConcurso?: number;
  dataProximoConcurso?: string;
  valorEstimadoProximoConcurso?: number;
  timeCoracao?: string | null;
  mesSorte?: string | null;
};

const CAIXA_PORTAL_BASE = 'https://loterias.caixa.gov.br';
const CAIXA_PARAMS_URL = `${CAIXA_PORTAL_BASE}/Style%20Library/json/params.txt`;
const LOTTERY_MIRROR_BASE = 'https://loteriascaixa-api.herokuapp.com/api';
const LOTECA_MIRROR_BASE = 'https://lotocarva.com/resultado/loteca';
const LOTECA_NEWS_MIRROR =
  'https://www.opovo.com.br/noticias/economia/loteria/loteca/';
const LATEST_CACHE_TTL_MS = 5 * 60 * 1000;

export function canServeCachedLatest(
  cacheAge: number,
  source: unknown
): boolean {
  return (
    cacheAge < LATEST_CACHE_TTL_MS &&
    (source === 'caixa' || source === 'mirror')
  );
}

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
  federal: '/Paginas/Federal.aspx',
  loteca: '/Paginas/Loteca.aspx',
};

async function getCaixaApiBases(): Promise<string[]> {
  const bases = new Set<string>([
    'https://servicebus2.caixa.gov.br/portaldeloterias',
    'https://servicebus3.caixa.gov.br/portaldeloterias',
  ]);

  try {
    const response = await fetch(CAIXA_PARAMS_URL, {
      headers: {
        'User-Agent': CAIXA_API_HEADERS['User-Agent'],
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': CAIXA_API_HEADERS['Accept-Language'],
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });

    if (response.ok) {
      const data = (await response.json()) as { urlapiloterias?: string };
      if (data.urlapiloterias) {
        bases.add(data.urlapiloterias);
      }
    }
  } catch {}

  return [...bases];
}

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

  return { ...data, fonteDados: 'caixa' };
}

export function normalizeMirrorLotteryResult(
  lotteryId: string,
  data: MirrorLotteryData
): LotteryApiData {
  const allNumbers = Array.isArray(data.dezenas) ? data.dezenas : [];
  const drawCount = lotteryId === 'duplasena' ? 6 : allNumbers.length;
  const firstDraw = allNumbers.slice(0, drawCount);
  const order = Array.isArray(data.dezenasOrdemSorteio)
    ? data.dezenasOrdemSorteio.slice(0, drawCount)
    : firstDraw;

  return {
    numero: data.concurso,
    numeroConcursoProximo: data.proximoConcurso,
    dataApuracao: data.data || '',
    dataProximoConcurso: data.dataProximoConcurso || '',
    dezenasSorteadasOrdemSorteio: order,
    listaDezenas: firstDraw,
    listaDezenasSegundoSorteio:
      lotteryId === 'duplasena' ? allNumbers.slice(6, 12) : undefined,
    trevosSorteados: Array.isArray(data.trevos) ? data.trevos : [],
    valorEstimadoProximoConcurso:
      typeof data.valorEstimadoProximoConcurso === 'number'
        ? data.valorEstimadoProximoConcurso
        : 0,
    acumulado: Boolean(data.acumulou),
    localSorteio: typeof data.local === 'string' ? data.local : '',
    nomeTimeCoracaoMesSorte: data.timeCoracao || data.mesSorte || '',
    listaRateioPremio: Array.isArray(data.premiacoes)
      ? data.premiacoes.map((prize) => ({
          descricaoFaixa: prize.descricao || '',
          faixa: prize.faixa || 0,
          numeroDeGanhadores: prize.ganhadores || 0,
          valorPremio: prize.valorPremio || 0,
        }))
      : [],
    fonteDados: 'mirror',
  };
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(?:x27|39);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseLotecaMirrorHtml(html: string): LotteryApiData | null {
  const contestMatch = html.match(/Concurso\s+(\d{3,})/i);
  const drawDateMatch = html.match(
    /Sorteio\s+realizado\s+em:\s*<strong>(\d{2}\/\d{2}\/\d{4})<\/strong>/i
  );
  const nextDateMatch = html.match(
    /Pr[oó]ximo\s+sorteio:\s*<strong>(\d{2}\/\d{2}\/\d{4})<\/strong>/i
  );

  if (!contestMatch || !drawDateMatch) {
    return null;
  }

  const contest = Number(contestMatch[1]);
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const prizes = rows
    .map((row, index) => {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
        (cell) => decodeHtmlText(cell[1])
      );
      if (cells.length < 3 || !/acertos/i.test(cells[0])) return null;
      const winners = Number(cells[1].replace(/\D/g, '')) || 0;
      const prizeValue =
        Number(
          cells[2]
            .replace(/[^\d,.]/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
        ) || 0;
      return {
        descricaoFaixa: cells[0],
        faixa: index + 1,
        numeroDeGanhadores: winners,
        valorPremio: prizeValue,
      };
    })
    .filter((prize): prize is NonNullable<typeof prize> => prize !== null);

  // Extract match results (14 games, each result is 0, 1, or 2)
  // lotocarva.com format: each game row has 3 td-palpite cells (1, X, 2)
  // The cell with "palpite-selected" class is the winning prediction
  const matchResults: string[] = [];
  for (const row of rows) {
    const rowHtml = row[1];
    const palpiteCells = rowHtml.match(
      /<td[^>]*class="[^"]*td-palpite[^"]*"[^>]*>([^<]*)<\/td>/gi
    );
    if (!palpiteCells || palpiteCells.length < 3) continue;

    // Find which of the 3 cells has palpite-selected
    let selectedIdx = -1;
    for (let i = 0; i < palpiteCells.length; i++) {
      if (/palpite-selected/i.test(palpiteCells[i])) {
        selectedIdx = i;
        break;
      }
    }
    if (selectedIdx >= 0) {
      // 0 = home win (1), 1 = draw (0), 2 = away win (2)
      matchResults.push(
        selectedIdx === 0 ? '1' : selectedIdx === 1 ? '0' : '2'
      );
    }
  }

  const estimativaMatch = html.match(
    /class="info-card-value">\s*R\$\s*([^<]+)<\/div>/i
  );
  let valorEstimado = 0;
  if (estimativaMatch) {
    valorEstimado =
      Number(
        estimativaMatch[1]
          .replace(/[^\d,.]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0;
  }

  return {
    numero: contest,
    numeroConcursoProximo: contest + 1,
    dataApuracao: drawDateMatch[1],
    dataProximoConcurso: nextDateMatch?.[1] || '',
    dezenasSorteadasOrdemSorteio: matchResults,
    listaDezenas: matchResults,
    valorEstimadoProximoConcurso: valorEstimado,
    acumulado: prizes[0]?.numeroDeGanhadores === 0,
    listaRateioPremio: prizes,
    fonteDados: 'mirror',
  };
}

export function parseLotecaNewsHtml(html: string): LotteryApiData | null {
  const contestMatch = html.match(
    /id=["']span_numero_concurso["'][^>]*>(\d{3,})</i
  );
  const drawDateMatch = html.match(
    /id=["']span_dia_semana_concurso["'][^>]*>(\d{2}\/\d{2}\/\d{4})</i
  );
  if (!contestMatch || !drawDateMatch) return null;

  const contest = Number(contestMatch[1]);

  const estimativaMatch = html.match(
    /class="detail-resp">\s*R\$\s*([^<]+)<\/p>/i
  );
  let valorEstimado = 0;
  if (estimativaMatch) {
    valorEstimado =
      Number(
        estimativaMatch[1]
          .replace(/[^\d,.]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0;
  }

  return {
    numero: contest,
    numeroConcursoProximo: contest + 1,
    dataApuracao: drawDateMatch[1],
    dataProximoConcurso: '',
    dezenasSorteadasOrdemSorteio: [],
    listaDezenas: [],
    valorEstimadoProximoConcurso: valorEstimado,
    acumulado: false,
    listaRateioPremio: [],
    fonteDados: 'mirror',
  };
}

async function fetchMirrorLotteryResult(
  lotteryId: string,
  contestNum?: number
): Promise<LotteryApiData | null> {
  try {
    if (lotteryId === 'loteca') {
      const sources = contestNum
        ? [
            {
              url: `${LOTECA_MIRROR_BASE}/${contestNum}`,
              parse: parseLotecaMirrorHtml,
            },
          ]
        : [
            { url: LOTECA_MIRROR_BASE, parse: parseLotecaMirrorHtml },
            { url: LOTECA_NEWS_MIRROR, parse: parseLotecaNewsHtml },
          ];

      for (const source of sources) {
        try {
          const response = await fetch(source.url, {
            headers: CAIXA_PAGE_HEADERS,
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
          });
          if (!response.ok) continue;
          const parsed = source.parse(await response.text());
          if (!parsed || (contestNum && parsed.numero !== contestNum)) continue;
          return parsed;
        } catch {}
      }
      return null;
    }

    const endpoint = contestNum ? String(contestNum) : 'latest';
    const response = await fetch(
      `${LOTTERY_MIRROR_BASE}/${lotteryId}/${endpoint}`,
      {
        headers: CAIXA_API_HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as MirrorLotteryData;
    if (!data.concurso) return null;
    return normalizeMirrorLotteryResult(lotteryId, data);
  } catch {
    return null;
  }
}

export async function fetchOfficialLotteryResult(
  lotteryId: string,
  contestNum?: number
): Promise<LotteryApiData | null> {
  const apiId = lotteryId === 'loteriafederal' ? 'federal' : lotteryId;
  const apiBases = await getCaixaApiBases();

  for (const base of apiBases) {
    const apiUrl = contestNum
      ? `${base}/api/${apiId}/${contestNum}`
      : `${base}/api/${apiId}`;

    try {
      return await fetchCaixaJson(apiUrl, { ...CAIXA_API_HEADERS });
    } catch {}
  }

  const pagePath = CAIXA_PAGE_BY_LOTTERY[apiId];
  if (!pagePath) {
    return fetchMirrorLotteryResult(apiId, contestNum);
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

    for (const base of apiBases) {
      const apiUrl = contestNum
        ? `${base}/api/${apiId}/${contestNum}`
        : `${base}/api/${apiId}`;

      try {
        return await fetchCaixaJson(apiUrl, headers);
      } catch {}
    }

    return fetchMirrorLotteryResult(apiId, contestNum);
  } catch {
    return fetchMirrorLotteryResult(apiId, contestNum);
  }
}
