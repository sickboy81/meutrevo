import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getErrorMessage } from '@/lib/api-auth';
import {
  canServeCachedLatest,
  fetchOfficialLotteryResult,
  enrichLotecaMatchData,
  getCaixaApiBases,
  fetchWithRetry,
  CAIXA_API_HEADERS,
} from '@/lib/caixa';
import { decorateLotteryResult } from '@/lib/lottery-results';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import {
  LotteryApiData,
  decorateResults,
  isIncompleteCachedResult,
  ensureCacheTable,
  saveToCache,
  getHistoryFromDB,
  getContestFromDB,
  getLatestCacheState,
  fetchAndCacheContest,
} from '@/lib/lottery-cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  await ensureCacheTable();

  const { type } = await params;

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
  // ─────────────────────────────────────────────────────────────────────────
  if (concurso) {
    const contestNumVal = parseInt(concurso, 10);
    if (isNaN(contestNumVal)) {
      return NextResponse.json(
        { error: 'Número de concurso inválido' },
        { status: 400 }
      );
    }

    const cached = await getContestFromDB(type, contestNumVal);
    if (cached) {
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

    const data = await fetchAndCacheContest(
      type,
      contestNumVal,
      fetchOfficialLotteryResult
    );
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
  // PATH B: Latest + history request
  // ─────────────────────────────────────────────────────────────────────────
  const cacheState = await getLatestCacheState(type);

  // For Loteca: force upstream fetch when latest has empty listaDezenas
  const lotecaCacheEmpty =
    type === 'loteca' && canServeCachedLatest(cacheState.age, cacheState.source)
      ? await (async () => {
          const h = await getHistoryFromDB(type, 1);
          if (h.length === 0) return false;
          const d = (
            decorateLotteryResult(type, h[0] as never) as LotteryApiData
          ).listaDezenas as string[] | undefined;
          return !d || d.length === 0;
        })()
      : false;

  if (
    canServeCachedLatest(cacheState.age, cacheState.source) &&
    !lotecaCacheEmpty
  ) {
    const localHistory = await getHistoryFromDB(type, limit, filters);
    if (localHistory.length > 0) {
      let latest = decorateLotteryResult(type, localHistory[0] as never);

      if (type === 'loteca') {
        const dezenas = (latest as LotteryApiData).listaDezenas as
          | string[]
          | undefined;
        if (!dezenas || dezenas.length === 0) {
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
      }

      // Fire-and-forget backfill
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
                    batch.map((num) =>
                      fetchAndCacheContest(
                        type,
                        num,
                        fetchOfficialLotteryResult
                      )
                    )
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

  // ─────────────────────────────────────────────────────────────────────────
  // STALE or EMPTY: fetch from Caixa
  // ─────────────────────────────────────────────────────────────────────────
  try {
    let rawLatest = await fetchOfficialLotteryResult(type);
    if (!rawLatest) {
      throw new Error('Nao foi possivel obter o ultimo concurso na Caixa');
    }

    // Loteca: ensure listaResultadoEquipeEsportiva from Caixa API
    if (type === 'loteca') {
      const dezenas = (rawLatest as LotteryApiData).listaDezenas as
        | string[]
        | undefined;
      if (!dezenas || dezenas.length === 0) {
        const enriched = await enrichLotecaMatchData(rawLatest);
        if (enriched) rawLatest = enriched;

        const enrichedDezenas = (rawLatest as LotteryApiData).listaDezenas as
          | string[]
          | undefined;
        const stillEmpty = !enrichedDezenas || enrichedDezenas.length === 0;
        if (stillEmpty && rawLatest.numero) {
          try {
            const apiBases = await getCaixaApiBases();
            for (const base of apiBases) {
              try {
                const specific = await fetchWithRetry(
                  `${base}/api/loteca/${rawLatest.numero}`,
                  { ...CAIXA_API_HEADERS },
                  2,
                  20000
                );
                if (
                  specific &&
                  (specific as Record<string, unknown>)
                    .listaResultadoEquipeEsportiva
                ) {
                  rawLatest = specific;
                  break;
                }
              } catch {}
            }
          } catch {}
        }
      }
    }

    const latestData = decorateLotteryResult(
      type,
      rawLatest as never
    ) as LotteryApiData;

    if (latestData.numero) {
      const latestNum = latestData.numero;
      await saveToCache(
        type,
        latestNum,
        latestData.dataApuracao || '',
        latestData
      );

      // Backfill missing contests
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
        if (missing.length > 0) {
          const BATCH = 20;
          for (let i = 0; i < missing.length; i += BATCH) {
            const batch = missing.slice(i, i + BATCH);
            await Promise.all(
              batch.map((num) =>
                fetchAndCacheContest(type, num, fetchOfficialLotteryResult)
              )
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
      // DB also failed
    }

    return NextResponse.json(
      {
        error: `API da Caixa offline e sem cache local disponível: ${message}`,
      },
      { status: 503 }
    );
  }
}
