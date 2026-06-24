import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, internalServerError } from '@/lib/api-auth';

const CAIXA_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

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
];

type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
};

async function saveContest(lotteryId: string, data: LotteryApiData) {
  if (!data.numero) return;
  try {
    await db.execute({
      sql: `INSERT OR IGNORE INTO lottery_cache (lottery, contest_num, draw_date, data_json, cached_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        lotteryId,
        data.numero,
        data.dataApuracao || '',
        JSON.stringify(data),
      ],
    });
  } catch {
    /* ignore duplicate */
  }
}

async function fetchContest(
  lotteryId: string,
  contestNum: number
): Promise<LotteryApiData | null> {
  try {
    const res = await fetch(
      `https://servicebus2.caixa.gov.br/portaldeloterias/api/${lotteryId}/${contestNum}`,
      { headers: CAIXA_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    return (await res.json()) as LotteryApiData;
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/seed-cache
 * Admin-only endpoint that populates the lottery_cache with the last 100 contests
 * for every supported lottery. Uses INSERT OR IGNORE so it never overwrites existing
 * cached data — only fills gaps. Safe to call repeatedly.
 */
export async function POST(request: Request) {
  try {
    const { user, response } = await requireRole(['admin']);
    if (response || !user) return response;

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const targetLimit: number =
      typeof body.limit === 'number' ? Math.min(body.limit, 100) : 100;
    const lotteriesToSeed: string[] = Array.isArray(body.lotteries)
      ? (body.lotteries as string[])
      : LOTTERIES;

    const report: Record<
      string,
      { fetched: number; skipped: number; errors: number }
    > = {};

    for (const lottery of lotteriesToSeed) {
      report[lottery] = { fetched: 0, skipped: 0, errors: 0 };

      // 1. Fetch the latest contest to know the current contest number
      let latestNum: number;
      try {
        const latestRes = await fetch(
          `https://servicebus2.caixa.gov.br/portaldeloterias/api/${lottery}`,
          { headers: CAIXA_HEADERS, signal: AbortSignal.timeout(10000) }
        );
        if (!latestRes.ok) {
          report[lottery].errors++;
          continue;
        }
        const latestData = (await latestRes.json()) as LotteryApiData;
        if (!latestData.numero) {
          report[lottery].errors++;
          continue;
        }
        latestNum = latestData.numero;
        await saveContest(lottery, latestData);
        report[lottery].fetched++;
      } catch {
        report[lottery].errors++;
        continue;
      }

      // 2. Find which contest numbers in the range are already cached
      const rangeStart = Math.max(1, latestNum - targetLimit + 1);
      const cachedRes = await db.execute({
        sql: `SELECT contest_num FROM lottery_cache WHERE lottery = ? AND contest_num >= ? AND contest_num <= ?`,
        args: [lottery, rangeStart, latestNum],
      });
      const cachedSet = new Set(
        cachedRes.rows.map((r) => r.contest_num as number)
      );

      const missing: number[] = [];
      for (let n = latestNum - 1; n >= rangeStart; n--) {
        if (cachedSet.has(n)) {
          report[lottery].skipped++;
        } else {
          missing.push(n);
        }
      }

      // 3. Fetch missing contests in batches of 10 to avoid overwhelming Caixa
      const BATCH = 10;
      for (let i = 0; i < missing.length; i += BATCH) {
        const batch = missing.slice(i, i + BATCH);
        const results = await Promise.all(
          batch.map((num) => fetchContest(lottery, num))
        );
        for (const data of results) {
          if (data) {
            await saveContest(lottery, data);
            report[lottery].fetched++;
          } else {
            report[lottery].errors++;
          }
        }
        // Small delay between batches to be respectful to the Caixa API
        if (i + BATCH < missing.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    // Return summary of what was done
    const totalFetched = Object.values(report).reduce(
      (s, r) => s + r.fetched,
      0
    );
    const totalSkipped = Object.values(report).reduce(
      (s, r) => s + r.skipped,
      0
    );
    const totalErrors = Object.values(report).reduce((s, r) => s + r.errors, 0);

    return NextResponse.json({
      success: true,
      summary: { totalFetched, totalSkipped, totalErrors },
      perLottery: report,
    });
  } catch (err: unknown) {
    return internalServerError('Seed cache error:', err);
  }
}

/**
 * GET /api/admin/seed-cache
 * Returns cache statistics (admin only).
 */
export async function GET() {
  try {
    const { user, response } = await requireRole(['admin']);
    if (response || !user) return response;

    const stats: Record<string, number> = {};
    for (const lottery of LOTTERIES) {
      const res = await db.execute({
        sql: `SELECT COUNT(*) as cnt, MAX(contest_num) as latest FROM lottery_cache WHERE lottery = ?`,
        args: [lottery],
      });
      if (res.rows.length > 0) {
        stats[lottery] = res.rows[0].cnt as number;
      }
    }

    const totalRes = await db.execute(
      `SELECT COUNT(*) as total FROM lottery_cache`
    );
    const total = (totalRes.rows[0]?.total as number) || 0;

    return NextResponse.json({ success: true, total, perLottery: stats });
  } catch (err: unknown) {
    return internalServerError('Cache stats error:', err);
  }
}
