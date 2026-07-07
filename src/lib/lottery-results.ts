import { db, isMissingDbEnvError } from '@/lib/db';
import { fetchOfficialLotteryResult } from '@/lib/caixa';

export type LotteryResult = {
  numero: number;
  numeroConcursoProximo?: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  trevosSorteados?: string[];
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  nomeMunicipioUFSorteio?: string;
  localSorteio?: string;
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
    const matches = (result as unknown as Record<string, unknown>)
      .listaResultadoEquipeEsportiva as
      | { nuGolEquipeUm: number; nuGolEquipeDois: number }[]
      | undefined;
    if (
      matches &&
      matches.length > 0 &&
      (!result.listaDezenas || result.listaDezenas.length < matches.length)
    ) {
      // Loteca results: 1 = home win, 0 = draw, 2 = away win
      const results = matches.map((m) => {
        if (m.nuGolEquipeUm > m.nuGolEquipeDois) return '1';
        if (m.nuGolEquipeUm === m.nuGolEquipeDois) return '0';
        return '2';
      });
      return {
        ...result,
        listaDezenas: results,
        dezenasSorteadasOrdemSorteio: results,
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
  const officialResult = await fetchOfficialLotteryResult(lotteryId);
  if (officialResult) {
    return decorateLotteryResult(lotteryId, officialResult as LotteryResult);
  }

  return decorateLotteryResult(lotteryId, await getCachedResult(lotteryId));
}
