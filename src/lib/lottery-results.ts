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
      badge: 'Quina de Sao Joao',
      title: `Quina em calendario especial da CAIXA`,
      message: `Os sorteios regulares da Quina estao temporariamente pausados para concentrar as apostas no concurso especial ${nextContest}. Por isso, o ultimo concurso regular continua aparecendo como ${result.numero} em ${result.dataApuracao}.`,
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
