import { db, isMissingDbEnvError } from '@/lib/db';
import { normalizeDatabaseDate } from '@/lib/database-date';
import { enrichLotecaMatchData, fetchOfficialLotteryResult } from '@/lib/caixa';

export type LotteryResult = {
  numero: number;
  numeroConcursoProximo?: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  listaResultadoEquipeEsportiva?: {
    nuGolEquipeUm?: number | string | null;
    nuGolEquipeDois?: number | string | null;
  }[];
  trevosSorteados?: string[];
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  nomeMunicipioUFSorteio?: string;
  localSorteio?: string;
  nomeTimeCoracaoMesSorte?: string;
  listaRateioPremio?: {
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
  statusNotice?: LotteryStatusNotice;
};

export type LotteryStatusNotice = {
  kind: 'special-draw';
  title: string;
  message: string;
  badge: string;
  officialUrl?: string;
};

async function getCachedResult(
  lotteryId: string
): Promise<LotteryResult | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT data_json FROM lottery_cache WHERE lottery = ? ORDER BY contest_num DESC LIMIT 1',
      args: [lotteryId],
    });
    if (res.rows.length > 0) {
      return JSON.parse(res.rows[0].data_json as string) as LotteryResult;
    }
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(`Failed to fetch cache for ${lotteryId}:`, e);
    }
  }
  return null;
}

export async function getRecentLotteryResults(
  lotteryId: string,
  limit = 10
): Promise<LotteryResult[]> {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const res = await db.execute({
      sql: 'SELECT data_json FROM lottery_cache WHERE lottery = ? ORDER BY contest_num DESC LIMIT ?',
      args: [lotteryId, safeLimit],
    });

    return res.rows
      .map((row) =>
        decorateLotteryResult(
          lotteryId,
          JSON.parse(row.data_json as string) as LotteryResult
        )
      )
      .filter((result): result is LotteryResult => result !== null);
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(`Failed to fetch recent contests for ${lotteryId}:`, e);
    }
    return [];
  }
}

export async function getLotteryContestResult(
  lotteryId: string,
  contestNumber: number
): Promise<LotteryResult | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT data_json FROM lottery_cache WHERE lottery = ? AND contest_num = ? LIMIT 1',
      args: [lotteryId, contestNumber],
    });
    if (res.rows.length > 0) {
      return decorateLotteryResult(
        lotteryId,
        JSON.parse(res.rows[0].data_json as string) as LotteryResult
      );
    }
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(
        `Failed to fetch contest ${contestNumber} for ${lotteryId}:`,
        e
      );
    }
  }

  const official = await fetchOfficialLotteryResult(lotteryId, contestNumber);
  if (!official || official.numero !== contestNumber) {
    return null;
  }

  const result = decorateLotteryResult(lotteryId, official as LotteryResult);
  if (!result) return null;
  const databaseDate = normalizeDatabaseDate(result.dataApuracao);
  if (!databaseDate) return result;

  try {
    await db.execute({
      sql: `INSERT INTO lottery_cache
            (lottery, contest_num, draw_date, data_json, cached_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (lottery, contest_num) DO UPDATE SET
              draw_date = EXCLUDED.draw_date,
              data_json = EXCLUDED.data_json,
              cached_at = CURRENT_TIMESTAMP`,
      args: [lotteryId, contestNumber, databaseDate, JSON.stringify(result)],
    });
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(`Failed to cache ${lotteryId} ${contestNumber}:`, e);
    }
  }

  return result;
}

function parseBrazilDate(date: string | undefined): Date | null {
  if (!date) return null;
  const [day, month, year] = date.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function decorateLotteryResult(
  lotteryId: string,
  result: LotteryResult | null
): LotteryResult | null {
  if (!result) return null;

  // Loteca: compute results from match scores (listaResultadoEquipeEsportiva)
  if (lotteryId === 'loteca') {
    const matches = result.listaResultadoEquipeEsportiva;
    if (
      matches &&
      matches.length > 0 &&
      (!result.listaDezenas || result.listaDezenas.length < matches.length)
    ) {
      // Loteca results: 1 = home win, 0 = draw, 2 = away win
      const results = matches.map((match) => {
        if (
          match.nuGolEquipeUm === null ||
          match.nuGolEquipeUm === undefined ||
          match.nuGolEquipeDois === null ||
          match.nuGolEquipeDois === undefined
        ) {
          return null;
        }
        const homeGoals = Number(match.nuGolEquipeUm);
        const awayGoals = Number(match.nuGolEquipeDois);
        if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) {
          return null;
        }
        if (homeGoals > awayGoals) return '1';
        if (homeGoals === awayGoals) return '0';
        return '2';
      });
      if (results.some((value) => value === null)) return result;

      const normalizedResults = results as string[];
      return {
        ...result,
        listaDezenas: normalizedResults,
        dezenasSorteadasOrdemSorteio: normalizedResults,
      };
    }
    return result;
  }

  if (lotteryId === 'loteriafederal') {
    const patch: Partial<LotteryResult> = {};

    // Fallback prize: Loteria Federal has fixed prizes (usually R$ 500.000)
    if (
      !result.valorEstimadoProximoConcurso ||
      result.valorEstimadoProximoConcurso === 0
    ) {
      patch.valorEstimadoProximoConcurso = 500000;
    }

    // Fallback next draw date: Loteria Federal draws Mon-Sat.
    // The API often returns empty string for dataProximoConcurso.
    if (!result.dataProximoConcurso) {
      // Calculate the next business day from today (never in the past)
      const now = new Date();
      const next = new Date(now);
      // If today is Sunday, move to Monday; otherwise use today
      if (next.getUTCDay() === 0) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      const dd = String(next.getUTCDate()).padStart(2, '0');
      const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = next.getUTCFullYear();
      patch.dataProximoConcurso = `${dd}/${mm}/${yyyy}`;
    }

    if (Object.keys(patch).length > 0) {
      return { ...result, ...patch };
    }
    return result;
  }

  if (lotteryId !== 'quina') {
    return result;
  }

  const drawDate = parseBrazilDate(result.dataApuracao);
  const nextDrawDate = parseBrazilDate(result.dataProximoConcurso);
  const hasLongGap =
    drawDate && nextDrawDate
      ? Math.round(
          (nextDrawDate.getTime() - drawDate.getTime()) / (1000 * 60 * 60 * 24)
        ) >= 7
      : false;
  const looksLikeSpecialDraw =
    result.valorEstimadoProximoConcurso >= 100_000_000 || hasLongGap;

  if (!looksLikeSpecialDraw) {
    return result;
  }

  const nextContest = result.numeroConcursoProximo ?? result.numero + 1;

  return {
    ...result,
    numeroConcursoProximo: nextContest,
    statusNotice: {
      kind: 'special-draw',
      badge: 'Quina de São João 🌽',
      title: 'Calendário Especial: Quina de São João',
      message: `Os sorteios diários regulares da Quina estão temporariamente suspensos para o período de apostas exclusivas da Quina de São João (Concurso ${nextContest}), que tem sorteio agendado para hoje, domingo (28/06/2026), a partir das 14h. Assim que a CAIXA realizar a apuração, os novos números e ganhadores aparecerão aqui automaticamente.`,
      officialUrl:
        'https://www.caixa.gov.br/loterias/comunicados-importantes/Paginas/default.aspx',
    },
  };
}

export async function getLatestLotteryResult(
  lotteryId: string
): Promise<LotteryResult | null> {
  const completeResult = async (
    result: LotteryResult | null
  ): Promise<LotteryResult | null> => {
    if (
      lotteryId === 'loteca' &&
      result &&
      (!result.listaDezenas || result.listaDezenas.length === 0)
    ) {
      const enriched = await enrichLotecaMatchData(result);
      if (enriched) result = enriched as LotteryResult;
    }
    return decorateLotteryResult(lotteryId, result);
  };

  const officialResult = await fetchOfficialLotteryResult(lotteryId);
  if (officialResult) {
    const officialComplete = await completeResult(
      officialResult as LotteryResult
    );
    if (
      lotteryId !== 'loteca' ||
      (officialComplete?.listaDezenas &&
        officialComplete.listaDezenas.length > 0)
    ) {
      return officialComplete;
    }

    // Prefer a previously enriched cache entry if the upstream response only
    // contains Loteca metadata during a transient Caixa failure.
    const cachedComplete = await completeResult(
      await getCachedResult(lotteryId)
    );
    if (
      cachedComplete?.listaDezenas &&
      cachedComplete.listaDezenas.length > 0
    ) {
      return cachedComplete;
    }
    return officialComplete;
  }

  return completeResult(await getCachedResult(lotteryId));
}
