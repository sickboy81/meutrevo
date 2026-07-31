import AppEntryLink from './AppEntryLink';
import {
  getRecentLotteryResults,
  type LotteryResult,
} from '@/lib/lottery-results';
import {
  isLotterySeoId,
  LOTTERY_SEO_CONFIGS,
  LOTTERY_SEO_LIST,
} from '@/lib/lottery-seo';

export default async function LotterySeoLinks({
  lotteryId,
  currentResult,
}: {
  lotteryId: string;
  currentResult?: LotteryResult | null;
}) {
  if (!isLotterySeoId(lotteryId)) return null;

  const config = LOTTERY_SEO_CONFIGS[lotteryId];
  const cachedResults = await getRecentLotteryResults(lotteryId, 6);
  const recentResults = [currentResult, ...cachedResults]
    .filter((result): result is LotteryResult => Boolean(result?.numero))
    .filter(
      (result, index, items) =>
        items.findIndex((item) => item.numero === result.numero) === index
    )
    .slice(0, 6);

  return (
    <section
      className="lottery-seo-links"
      aria-label={`Navegação ${config.name}`}
    >
      {recentResults.length > 0 && (
        <div>
          <h2>Concursos recentes da {config.name}</h2>
          <div className="lottery-contest-links">
            {recentResults.map((result) => (
              <AppEntryLink
                key={result.numero}
                href={`${config.path}/concurso-${result.numero}`}
              >
                <strong>Concurso {result.numero}</strong>
                <span>{result.dataApuracao || 'Resultado oficial'}</span>
              </AppEntryLink>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Todas as modalidades">
        <h2>Resultados de todas as loterias</h2>
        <div className="lottery-modality-links">
          {LOTTERY_SEO_LIST.map((lottery) => (
            <AppEntryLink
              key={lottery.id}
              href={lottery.path}
              aria-current={lottery.id === lotteryId ? 'page' : undefined}
              style={
                { '--lottery-link-color': lottery.color } as React.CSSProperties
              }
            >
              {lottery.name}
            </AppEntryLink>
          ))}
        </div>
      </nav>
    </section>
  );
}
