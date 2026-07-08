import { db } from '@/lib/db';
import { decorateLotteryResult } from '@/lib/lottery-results';

export type LotteryApiData = Record<string, unknown> & {
  numero?: number;
  dataApuracao?: string;
  fonteDados?: 'caixa' | 'mirror';
};

export function decorateResults(
  lotteryId: string,
  items: LotteryApiData[]
): LotteryApiData[] {
  return items.map(
    (item) => decorateLotteryResult(lotteryId, item as never) as LotteryApiData
  );
}

export function isIncompleteCachedResult(
  lotteryId: string,
  item: LotteryApiData | null
): boolean {
  if (!item) return true;
  if (lotteryId !== 'loteca') return false;
  if (!item.numero) return true;
  return false;
}

export async function ensureCacheTable() {
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
    await db
      .execute(`ALTER TABLE lottery_cache ADD COLUMN cached_at DATETIME`)
      .catch(() => {
        /* already exists */
      });
  } catch (err) {
    console.error('Failed to ensure lottery_cache table:', err);
  }
}

export async function saveToCache(
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

export async function getHistoryFromDB(
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

export async function getContestFromDB(
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

export async function getLatestCacheState(
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

export async function fetchAndCacheContest(
  lotteryId: string,
  contestNum: number,
  fetchFn: (id: string, num?: number) => Promise<LotteryApiData | null>
): Promise<LotteryApiData | null> {
  try {
    const raw = await fetchFn(lotteryId, contestNum);
    if (!raw) return null;
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
