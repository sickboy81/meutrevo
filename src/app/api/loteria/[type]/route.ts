import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getErrorMessage } from '@/lib/api-auth';

type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
};

const CAIXA_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Ensure the cache table is initialized (idempotent)
async function ensureCacheTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lottery_cache (
        lottery TEXT NOT NULL,
        contest_num INTEGER NOT NULL,
        draw_date TEXT NOT NULL,
        data_json TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (lottery, contest_num)
      );
    `);
    // Add cached_at column if upgrading from old schema that used created_at
    await db
      .execute(`ALTER TABLE lottery_cache ADD COLUMN cached_at DATETIME`)
      .catch(() => {
        /* already exists */
      });
  } catch (err) {
    console.error('Failed to ensure lottery_cache table:', err);
  }
}

// Persist a contest result permanently — past results NEVER change
async function saveToCache(
  lotteryId: string,
  contestNum: number,
  dateStr: string,
  data: LotteryApiData
) {
  try {
    await db.execute({
      sql: `INSERT OR REPLACE INTO lottery_cache (lottery, contest_num, draw_date, data_json, cached_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [lotteryId, contestNum, dateStr, JSON.stringify(data)],
    });
  } catch (e) {
    console.error('Error writing to cache:', e);
  }
}

// Read N most recent contests from DB for a given lottery
async function getHistoryFromDB(
  lotteryId: string,
  maxCount: number,
  filters?: {
    dateStart?: string;
    dateEnd?: string;
    contestMin?: number;
    contestMax?: number;
  }
): Promise<LotteryApiData[]> {
  try {
    let sql = `SELECT data_json FROM lottery_cache WHERE lottery = ?`;
    const args: (string | number)[] = [lotteryId];

    if (filters?.dateStart) {
      sql += ` AND draw_date >= ?`;
      args.push(filters.dateStart);
    }
    if (filters?.dateEnd) {
      sql += ` AND draw_date <= ?`;
      args.push(filters.dateEnd);
    }
    if (filters?.contestMin) {
      sql += ` AND contest_num >= ?`;
      args.push(filters.contestMin);
    }
    if (filters?.contestMax) {
      sql += ` AND contest_num <= ?`;
      args.push(filters.contestMax);
    }

    sql += ` ORDER BY contest_num DESC LIMIT ?`;
    args.push(maxCount);

    const res = await db.execute({ sql, args });
    return res.rows.map(
      (row) => JSON.parse(row.data_json as string) as LotteryApiData
    );
  } catch (e) {
    console.error('Error fetching history from DB:', e);
    return [];
  }
}

// Read a single specific contest from DB
async function getContestFromDB(
  lotteryId: string,
  contestNum: number
): Promise<LotteryApiData | null> {
  try {
    const res = await db.execute({
      sql: `SELECT data_json FROM lottery_cache WHERE lottery = ? AND contest_num = ? LIMIT 1`,
      args: [lotteryId, contestNum],
    });
    if (res.rows.length > 0) {
      return JSON.parse(res.rows[0].data_json as string) as LotteryApiData;
    }
    return null;
  } catch {
    return null;
  }
}

// Get how old (in ms) our latest cached entry is
async function getLatestCacheAge(lotteryId: string): Promise<number> {
  try {
    const res = await db.execute({
      sql: `SELECT cached_at FROM lottery_cache WHERE lottery = ? ORDER BY contest_num DESC LIMIT 1`,
      args: [lotteryId],
    });
    if (res.rows.length > 0 && res.rows[0].cached_at) {
      const cachedAt = new Date(res.rows[0].cached_at as string).getTime();
      return Date.now() - cachedAt;
    }
    return Infinity; // no cache at all → very stale
  } catch {
    return Infinity;
  }
}

// Fetch a single contest from Caixa and save to cache
async function fetchAndCacheContest(
  lotteryId: string,
  contestNum: number
): Promise<LotteryApiData | null> {
  try {
    const res = await fetch(
      `https://servicebus2.caixa.gov.br/portaldeloterias/api/${lotteryId}/${contestNum}`,
      { headers: CAIXA_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as LotteryApiData;
    if (data.numero) {
      await saveToCache(lotteryId, data.numero, data.dataApuracao || '', data);
    }
    return data;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  await ensureCacheTable();

  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const concurso = searchParams.get('concurso');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? Math.min(parseInt(limitStr, 10), 100) : 1;
  const dateStart = searchParams.get('dataInicio') || undefined;
  const dateEnd = searchParams.get('dataFim') || undefined;
  const contestMinStr = searchParams.get('concursoMin');
  const contestMaxStr = searchParams.get('concursoMax');
  const contestMin = contestMinStr ? parseInt(contestMinStr, 10) : undefined;
  const contestMax = contestMaxStr ? parseInt(contestMaxStr, 10) : undefined;
  const filters = { dateStart, dateEnd, contestMin, contestMax };

  // ─────────────────────────────────────────────────────────────────────────
  // PATH A: Specific contest query (e.g. ?concurso=2750)
  // Historical contest data is IMMUTABLE — always serve from cache if present
  // ─────────────────────────────────────────────────────────────────────────
  if (concurso) {
    const contestNumVal = parseInt(concurso, 10);
    if (isNaN(contestNumVal)) {
      return NextResponse.json(
        { error: 'Número de concurso inválido' },
        { status: 400 }
      );
    }

    // 1. Check DB first — no TTL needed for historical data
    const cached = await getContestFromDB(type, contestNumVal);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db' },
      });
    }

    // 2. Not in cache → fetch from Caixa and persist forever
    const data = await fetchAndCacheContest(type, contestNumVal);
    if (data) {
      return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS', 'X-Cache-Source': 'caixa' },
      });
    }

    return NextResponse.json(
      { error: `Concurso ${contestNumVal} não encontrado` },
      { status: 404 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATH B: Latest + history request (e.g. ?limit=30)
  //
  // Strategy:
  //   1. If our latest cached entry is FRESH (< 2 hours old), serve entirely
  //      from DB — no Caixa call needed.
  //   2. If stale (≥ 2 hours), call Caixa for the latest contest number only.
  //      - If the latest contest number is ALREADY in our DB, the only thing
  //        that could have changed is valorEstimadoProximoConcurso — update it.
  //      - If it's a NEW contest number, cache it and backfill any gaps.
  //   3. If Caixa is offline, always fall back to DB gracefully.
  // ─────────────────────────────────────────────────────────────────────────

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const cacheAge = await getLatestCacheAge(type);

  // FAST PATH: cache is fresh, serve entirely from DB
  if (cacheAge < TWO_HOURS_MS) {
    const localHistory = await getHistoryFromDB(type, limit, filters);
    if (localHistory.length > 0) {
      return NextResponse.json(
        { latest: localHistory[0], history: localHistory },
        { headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db-fresh' } }
      );
    }
  }

  // STALE or EMPTY: check Caixa for the latest
  try {
    const latestRes = await fetch(
      `https://servicebus2.caixa.gov.br/portaldeloterias/api/${type}`,
      { headers: CAIXA_HEADERS, signal: AbortSignal.timeout(10000) }
    );

    if (!latestRes.ok) throw new Error(`Caixa API status ${latestRes.status}`);

    const latestData = (await latestRes.json()) as LotteryApiData;

    if (latestData.numero) {
      const latestNum = latestData.numero;

      // Always persist/update the latest contest
      await saveToCache(
        type,
        latestNum,
        latestData.dataApuracao || '',
        latestData
      );

      // Backfill historical contests that are missing from DB (max 100)
      if (limit > 1) {
        const rangeStart = Math.max(1, latestNum - limit + 1);

        const cachedNumsRes = await db.execute({
          sql: `SELECT contest_num FROM lottery_cache WHERE lottery = ? AND contest_num >= ? AND contest_num <= ?`,
          args: [type, rangeStart, latestNum],
        });
        const cachedSet = new Set(
          cachedNumsRes.rows.map((r) => r.contest_num as number)
        );

        const missing: number[] = [];
        for (let n = latestNum - 1; n >= rangeStart; n--) {
          if (!cachedSet.has(n)) missing.push(n);
        }

        // Fetch missing in parallel (throttled to 20 at a time to avoid hammering Caixa)
        if (missing.length > 0) {
          const BATCH = 20;
          for (let i = 0; i < missing.length; i += BATCH) {
            const batch = missing.slice(i, i + BATCH);
            await Promise.all(
              batch.map((num) => fetchAndCacheContest(type, num))
            );
          }
        }
      }
    }

    const history = await getHistoryFromDB(type, limit, filters);
    return NextResponse.json(
      {
        latest: history[0] || latestData,
        history: history.length > 0 ? history : [latestData],
      },
      { headers: { 'X-Cache': 'MISS', 'X-Cache-Source': 'caixa' } }
    );
  } catch (err: unknown) {
    // Caixa is offline → always fall back to DB
    const message = getErrorMessage(err);
    console.warn(`Caixa API unavailable (${message}). Serving from DB cache.`);

    const cachedHistory = await getHistoryFromDB(type, limit, filters);
    if (cachedHistory.length > 0) {
      return NextResponse.json(
        { latest: cachedHistory[0], history: cachedHistory },
        { headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db-fallback' } }
      );
    }

    return NextResponse.json(
      {
        error: `API da Caixa offline e sem cache local disponível: ${message}`,
      },
      { status: 503 }
    );
  }
}
