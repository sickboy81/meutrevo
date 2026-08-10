import postgres from 'postgres';

const CAIXA_BASES = [
  'https://servicebus3.caixa.gov.br/portaldeloterias',
  'https://servicebus2.caixa.gov.br/portaldeloterias',
];

const LOTTERIES = [
  'megasena',
  'lotofacil',
  'quina',
  'lotomania',
  'maismilionaria',
  'duplasena',
  'diadesorte',
  'timemania',
  'supersete',
  'loteca',
  'federal',
];

const headers = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.7',
  'User-Agent': 'MeuTrevoLotteryCollector/1.0',
};

const timeout = (ms) => AbortSignal.timeout(ms);

async function fetchFromCaixa(lottery) {
  const responses = await Promise.allSettled(
    CAIXA_BASES.map(async (base) => {
      const response = await fetch(`${base}/api/${lottery}`, {
        headers,
        cache: 'no-store',
        signal: timeout(20_000),
      });
      if (!response.ok) throw new Error(`${response.status} from ${base}`);
      return response.json();
    })
  );

  const results = responses
    .filter((item) => item.status === 'fulfilled')
    .map((item) => item.value)
    .filter((item) => Number.isInteger(item?.numero));

  return results.reduce(
    (latest, item) => (!latest || item.numero > latest.numero ? item : latest),
    null
  );
}

function decorateLoteca(result) {
  if (
    result?.tipoJogo !== 'LOTECA' &&
    !Array.isArray(result?.listaResultadoEquipeEsportiva)
  ) {
    return result;
  }

  const matches = result.listaResultadoEquipeEsportiva ?? [];
  const predictions = matches.map((match) => {
    const home = Number(match.nuGolEquipeUm);
    const away = Number(match.nuGolEquipeDois);
    if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
    return home > away ? '1' : home === away ? '0' : '2';
  });

  if (predictions.length === 0 || predictions.some((value) => value === null)) {
    return result;
  }

  return {
    ...result,
    listaDezenas: predictions,
    dezenasSorteadasOrdemSorteio: predictions,
  };
}

async function ensureTable(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lottery_cache (
      lottery TEXT NOT NULL,
      contest_num INTEGER NOT NULL,
      draw_date TEXT,
      data_json TEXT NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (lottery, contest_num)
    )
  `);
}

function createPostgresAdapter(url) {
  const sql = postgres(url, { max: 1, connect_timeout: 15, prepare: false });
  const normalize = (query) => {
    const input = typeof query === 'string' ? { sql: query, args: [] } : query;
    let index = 0;
    let text = input.sql.replace(/\?/g, () => `$${++index}`);
    text = text.replace(/INSERT OR REPLACE INTO/gi, 'INSERT INTO');
    if (text.includes('INSERT INTO lottery_cache')) {
      text = `${text} ON CONFLICT (lottery, contest_num) DO UPDATE SET draw_date = EXCLUDED.draw_date, data_json = EXCLUDED.data_json, cached_at = CURRENT_TIMESTAMP`;
    }
    return { text, args: input.args ?? [] };
  };
  return {
    async execute(query) {
      const { text, args } = normalize(query);
      const rows = await sql.unsafe(text, args);
      return { rows, rowsAffected: rows.count };
    },
    async close() {
      await sql.end({ timeout: 5 });
    },
  };
}

function normalizeDatabaseDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) return null;
    return `${year}-${month}-${day}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return null;
  const [, year, month, day] = iso;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) return null;
  return `${year}-${month}-${day}`;
}

async function saveIfNewer(db, lottery, result) {
  const current = await db.execute({
    sql: 'SELECT MAX(contest_num) AS latest FROM lottery_cache WHERE lottery = ?',
    args: [lottery],
  });
  const latest = Number(current.rows[0]?.latest ?? 0);
  if (result.numero < latest) {
    return { lottery, status: 'skipped', contest: latest };
  }

  const drawDate = normalizeDatabaseDate(result.dataApuracao);
  if (!drawDate) {
    return {
      lottery,
      status: 'skipped',
      contest: result.numero,
      reason: 'invalid draw date',
    };
  }

  await db.execute({
    sql: `INSERT OR REPLACE INTO lottery_cache
      (lottery, contest_num, draw_date, data_json, cached_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    args: [
      lottery,
      result.numero,
      drawDate,
      JSON.stringify(result),
    ],
  });
  return { lottery, status: 'updated', contest: result.numero };
}

if (!process.env.SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL is required');
}

const db = createPostgresAdapter(process.env.SUPABASE_DATABASE_URL);
await ensureTable(db);

const reports = await Promise.all(
  LOTTERIES.map(async (lottery) => {
    try {
      const result = decorateLoteca(await fetchFromCaixa(lottery));
      if (!result)
        return { lottery, status: 'error', reason: 'no valid source result' };
      return await saveIfNewer(db, lottery, result);
    } catch (error) {
      return {
        lottery,
        status: 'error',
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  })
);

for (const report of reports) console.log(JSON.stringify(report));
if (reports.some((report) => report.status === 'error')) process.exitCode = 1;
await db.close?.();
