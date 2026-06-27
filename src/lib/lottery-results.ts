import { db, isMissingDbEnvError } from '@/lib/db';
import { fetchOfficialLotteryResult } from '@/lib/caixa';

export type LotteryResult = {
  numero: number;
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

export async function getLatestLotteryResult(
  lotteryId: string
): Promise<LotteryResult | null> {
  const officialResult = await fetchOfficialLotteryResult(lotteryId);
  if (officialResult) {
    return officialResult as LotteryResult;
  }

  return getCachedResult(lotteryId);
}
