import { NextResponse } from 'next/server';
import { fetchOfficialLotteryResult } from '@/lib/caixa';
import { saveToCache } from '@/lib/lottery-cache';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import { checkScheduledGames } from '@/lib/game-schedule-service';
import { reportServerError } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const reports = await Promise.all(
    Object.keys(LOTTERY_CONFIGS).map(async (lottery) => {
      try {
        const result = await fetchOfficialLotteryResult(lottery);
        if (!result?.numero) {
          reportServerError(new Error('Resultado oficial indisponível'), {
            operation: 'collect_lottery',
            lottery,
          });
          return { lottery, status: 'error', reason: 'resultado indisponível' };
        }

        await saveToCache(
          lottery,
          result.numero,
          result.dataApuracao || '',
          result
        );
        const schedules = await checkScheduledGames(
          lottery,
          result.numero,
          result as unknown as import('@/app/types').LotteryResult
        );
        return {
          lottery,
          status: 'updated',
          contest: result.numero,
          schedulesChecked: schedules.checked,
        };
      } catch (error) {
        reportServerError(error, {
          operation: 'collect_lottery',
          lottery,
        });
        return {
          lottery,
          status: 'error',
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  const errors = reports.filter((report) => report.status === 'error');
  return NextResponse.json(
    {
      ok: errors.length === 0,
      updatedAt: new Date().toISOString(),
      reports,
    },
    { status: errors.length === reports.length ? 503 : 200 }
  );
}
