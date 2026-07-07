import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getErrorMessage } from '@/lib/api-auth';
import {
  canServeCachedLatest,
  fetchOfficialLotteryResult,
  enrichLotecaMatchData,
} from '@/lib/caixa';
import { decorateLotteryResult } from '@/lib/lottery-results';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';

type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
};

function decorateResults(
  lotteryId: string,
  items: LotteryApiData[]
): LotteryApiData[] {
  return items.map(
    (item) => decorateLotteryResult(lotteryId, item as never) as LotteryApiData
  );
}

function isIncompleteCachedResult(
  lotteryId: string,
  item: LotteryApiData | null
): boolean {
  if (!item) return true;
  if (lotteryId !== 'loteca') return false;

  // Only discard records that have no contest number at all (completely broken)
  if (!item.numero) return true;

  // Accept records even with partial dezenas — they're better than nothing for history
  return false;
}

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
    return res.rows
      .map(
        (row) =>
          decorateLotteryResult(
            lotteryId,
            JSON.parse(row.data_json as string) as never
          ) as LotteryApiData
      )
      .filter((item) => !isIncompleteCachedResult(lotteryId, item));
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
      const parsed = decorateLotteryResult(
        lotteryId,
        JSON.parse(res.rows[0].data_json as string) as never
      ) as LotteryApiData;
      return isIncompleteCachedResult(lotteryId, parsed) ? null : parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// Get how old (in ms) our latest cached entry is
async function getLatestCacheState(
  lotteryId: string
): Promise<{ age: number; source?: unknown }> {
  try {
    const res = await db.execute({
      sql: `SELECT cached_at, data_json FROM lottery_cache WHERE lottery = ? ORDER BY contest_num DESC LIMIT 1`,
      args: [lotteryId],
    });
    if (res.rows.length > 0 && res.rows[0].cached_at) {
      const cachedAt = new Date(res.rows[0].cached_at as string).getTime();
      const data = decorateLotteryResult(
        lotteryId,
        JSON.parse(res.rows[0].data_json as string) as never
      ) as LotteryApiData;
      if (isIncompleteCachedResult(lotteryId, data)) {
        return { age: Infinity };
      }
      return { age: Date.now() - cachedAt, source: data.fonteDados };
    }
    return { age: Infinity };
  } catch {
    return { age: Infinity };
  }
}

// Fetch a single contest from Caixa and save to cache
async function fetchAndCacheContest(
  lotteryId: string,
  contestNum: number
): Promise<LotteryApiData | null> {
  try {
    const raw = await fetchOfficialLotteryResult(lotteryId, contestNum);
    if (!raw) return null;
    // Decorate before caching so derived fields (e.g. Loteca listaDezenas) are persisted
    const data = decorateLotteryResult(
      lotteryId,
      raw as never
    ) as LotteryApiData;
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

  // Validate lottery type
  if (!LOTTERY_CONFIGS[type]) {
    return NextResponse.json(
      {
        error: `Lottery type '${type}' is not supported. Valid types: ${Object.keys(LOTTERY_CONFIGS).join(', ')}`,
      },
      { status: 400 }
    );
  }

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
      // For Loteca: if cached data has empty listaDezenas, try Caixa API
      if (type === 'loteca') {
        const enriched = await enrichLotecaMatchData(cached);
        if (enriched !== cached) {
          await saveToCache(
            type,
            contestNumVal,
            enriched?.dataApuracao || '',
            enriched!
          );
          return NextResponse.json(
            decorateLotteryResult(type, enriched as never),
            {
              headers: {
                'X-Cache': 'ENRICHED',
                'X-Cache-Source': 'caixa-retry',
              },
            }
          );
        }
      }
      return NextResponse.json(decorateLotteryResult(type, cached as never), {
        headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db' },
      });
    }

    // 2. Not in cache → fetch from Caixa and persist forever
    const data = await fetchAndCacheContest(type, contestNumVal);
    if (data) {
      return NextResponse.json(decorateLotteryResult(type, data as never), {
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
  //   1. If our latest cached entry is verified and fresh (< 5 minutes), serve
  //      from DB — no Caixa call needed.
  //   2. If stale (>= 5 minutes), call the upstream providers for the latest.
  //      - If the latest contest number is ALREADY in our DB, the only thing
  //        that could have changed is valorEstimadoProximoConcurso — update it.
  //      - If it's a NEW contest number, cache it and backfill any gaps.
  //   3. If Caixa is offline, always fall back to DB gracefully.
  // ─────────────────────────────────────────────────────────────────────────

  const cacheState = await getLatestCacheState(type);

  // Old rows without provider provenance must be checked upstream immediately.
  if (canServeCachedLatest(cacheState.age, cacheState.source)) {
    const localHistory = await getHistoryFromDB(type, limit, filters);
    if (localHistory.length > 0) {
      let latest = decorateLotteryResult(type, localHistory[0] as never);
      // For Loteca: if cached data has empty listaDezenas, try Caixa API
      if (type === 'loteca') {
        const dezenas = (latest as LotteryApiData).listaDezenas as
          | string[]
          | undefined;
        const needsEnrichment = !dezenas || dezenas.length === 0;
        if (needsEnrichment) {
          const enriched = await enrichLotecaMatchData(
            latest as LotteryApiData
          );
          if (enriched && enriched !== latest) {
            latest = decorateLotteryResult(type, enriched as never);
            if (enriched.numero) {
              await saveToCache(
                type,
                enriched.numero,
                enriched.dataApuracao || '',
                enriched as LotteryApiData
              );
            }
          }
        }
        // If latest still has empty listaDezenas (draw in progress),
        // use the first completed contest as the primary display
        const latestDezenas = (latest as LotteryApiData).listaDezenas as
          | string[]
          | undefined;
        if (!latestDezenas || latestDezenas.length === 0) {
          const completedContest = localHistory.find((item) => {
            const decorated = decorateLotteryResult(type, item as never);
            const d = (decorated as LotteryApiData).listaDezenas as
              | string[]
              | undefined;
            return d && d.length > 0;
          });
          if (completedContest) {
            latest = decorateLotteryResult(type, completedContest as never);
          }
        }
      }
      // Fire-and-forget backfill when DB has fewer results than requested
      if (
        limit > 1 &&
        localHistory.length < limit &&
        !filters.dateStart &&
        !filters.dateEnd &&
        !filters.contestMin &&
        !filters.contestMax
      ) {
        const latestNum = (localHistory[0] as LotteryApiData).numero;
        if (latestNum) {
          const rangeStart = Math.max(1, latestNum - limit + 1);
          db.execute({
            sql: `SELECT contest_num FROM lottery_cache WHERE lottery = ? AND contest_num >= ? AND contest_num <= ?`,
            args: [type, rangeStart, latestNum],
          })
            .then((cachedNumsRes) => {
              const cachedSet = new Set(
                cachedNumsRes.rows.map((r) => r.contest_num as number)
              );
              const missing: number[] = [];
              for (let n = latestNum - 1; n >= rangeStart; n--) {
                if (!cachedSet.has(n)) missing.push(n);
              }
              if (missing.length > 0) {
                const BATCH = 20;
                const runBatch = (i: number) => {
                  if (i >= missing.length) return;
                  const batch = missing.slice(i, i + BATCH);
                  Promise.all(
                    batch.map((num) => fetchAndCacheContest(type, num))
                  ).then(() => runBatch(i + BATCH));
                };
                runBatch(0);
              }
            })
            .catch(() => {});
        }
      }
      return NextResponse.json(
        {
          latest,
          history: decorateResults(type, localHistory),
        },
        { headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db-fresh' } }
      );
    }
  }

  // STALE or EMPTY: check Caixa for the latest
  try {
    let rawLatest = await fetchOfficialLotteryResult(type);
    if (!rawLatest) {
      throw new Error('Nao foi possivel obter o ultimo concurso na Caixa');
    }
    // For Loteca: if mirror returned empty results, try Caixa API again
    if (type === 'loteca') {
      rawLatest = await enrichLotecaMatchData(rawLatest);
    }
    // Decorate before caching so derived fields (e.g. Loteca listaDezenas) are persisted
    const latestData = decorateLotteryResult(
      type,
      rawLatest as never
    ) as LotteryApiData;

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
        latest: decorateLotteryResult(
          type,
          (history[0] || latestData) as never
        ),
        history: decorateResults(
          type,
          history.length > 0 ? history : [latestData]
        ),
      },
      { headers: { 'X-Cache': 'MISS', 'X-Cache-Source': 'caixa' } }
    );
  } catch (err: unknown) {
    // Caixa is offline → always fall back to DB, even with incomplete entries
    const message = getErrorMessage(err);
    console.warn(`Caixa API unavailable (${message}). Serving from DB cache.`);

    try {
      let fbSql = `SELECT data_json FROM lottery_cache WHERE lottery = ?`;
      const fbArgs: (string | number)[] = [type];
      if (filters?.dateStart) {
        fbSql += ` AND draw_date >= ?`;
        fbArgs.push(filters.dateStart);
      }
      if (filters?.dateEnd) {
        fbSql += ` AND draw_date <= ?`;
        fbArgs.push(filters.dateEnd);
      }
      if (filters?.contestMin) {
        fbSql += ` AND contest_num >= ?`;
        fbArgs.push(filters.contestMin);
      }
      if (filters?.contestMax) {
        fbSql += ` AND contest_num <= ?`;
        fbArgs.push(filters.contestMax);
      }
      fbSql += ` ORDER BY contest_num DESC LIMIT ?`;
      fbArgs.push(limit);

      const fbRes = await db.execute({ sql: fbSql, args: fbArgs });
      const cachedHistory = fbRes.rows
        .map(
          (row) =>
            decorateLotteryResult(
              type,
              JSON.parse(row.data_json as string) as never
            ) as LotteryApiData
        )
        .filter((item) => !isIncompleteCachedResult(type, item));

      if (cachedHistory.length > 0) {
        return NextResponse.json(
          {
            latest: decorateLotteryResult(type, cachedHistory[0] as never),
            history: decorateResults(type, cachedHistory),
          },
          { headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'db-fallback' } }
        );
      }
    } catch {
      // DB also failed — fall through to 503
    }

    return NextResponse.json(
      {
        error: `API da Caixa offline e sem cache local disponível: ${message}`,
      },
      { status: 503 }
    );
  }
}
