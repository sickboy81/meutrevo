import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AppEntryLink from '@/app/components/AppEntryLink';
import {
  getLotteryContestResult,
  getRecentLotteryResults,
  type LotteryResult,
} from '@/lib/lottery-results';
import {
  isLotterySeoId,
  LOTTERY_SEO_CONFIGS,
  type LotterySeoId,
} from '@/lib/lottery-seo';

export const revalidate = 3600;

type ContestPageProps = {
  params: Promise<{ lottery: string; contestSlug: string }>;
};

type ContestRouteData = {
  lotteryId: LotterySeoId;
  contestNumber: number;
  result: LotteryResult;
};

const getContestRouteData = cache(
  async (
    lottery: string,
    contestSlug: string
  ): Promise<ContestRouteData | null> => {
    if (!isLotterySeoId(lottery)) return null;

    const match = /^concurso-(\d+)$/.exec(contestSlug);
    if (!match) return null;

    const contestNumber = Number(match[1]);
    if (!Number.isSafeInteger(contestNumber) || contestNumber <= 0) {
      return null;
    }

    const result = await getLotteryContestResult(lottery, contestNumber);
    if (!result) return null;

    return { lotteryId: lottery, contestNumber, result };
  }
);

function getResultNumbers(
  lotteryId: LotterySeoId,
  result: LotteryResult
): string[] {
  const numbers =
    result.listaDezenas || result.dezenasSorteadasOrdemSorteio || [];

  if (lotteryId === 'loteriafederal' || lotteryId === 'supersete') {
    return [...numbers];
  }
  if (lotteryId === 'loteca') {
    return [...numbers].map((value) => (value === '0' ? 'X' : value));
  }

  return [...numbers]
    .map((value) => Number(value))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .map((value) => String(value).padStart(2, '0'));
}

function toIsoDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  const [day, month, year] = date.split('/').map(Number);
  if (!day || !month || !year) return undefined;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatCurrency(value: number | undefined): string {
  if (!value) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function buildDescription(
  name: string,
  result: LotteryResult,
  numbers: string[]
): string {
  const numberText =
    numbers.length > 10
      ? ` Consulte as ${numbers.length} dezenas sorteadas.`
      : numbers.length > 0
        ? ` Números: ${numbers.join(', ')}.`
        : '';
  const description = `Resultado da ${name}, concurso ${result.numero}, de ${result.dataApuracao || 'data recente'}.${numberText} Confira prêmio e rateio oficial.`;
  return description.length <= 158
    ? description
    : `${description.slice(0, 155).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: ContestPageProps): Promise<Metadata> {
  const { lottery, contestSlug } = await params;
  const data = await getContestRouteData(lottery, contestSlug);

  if (!data) {
    return {
      title: 'Concurso não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const config = LOTTERY_SEO_CONFIGS[data.lotteryId];
  const numbers = getResultNumbers(data.lotteryId, data.result);
  const title = `Resultado ${config.name} Concurso ${data.contestNumber}`;
  const description = buildDescription(config.name, data.result, numbers);
  const canonical = `${config.path}/concurso-${data.contestNumber}`;
  const image = `/og/${data.lotteryId}?contest=${data.contestNumber}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Meu Trevo`,
      description,
      url: canonical,
      siteName: 'Meu Trevo',
      locale: 'pt_BR',
      type: 'article',
      publishedTime: toIsoDate(data.result.dataApuracao),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${config.name} concurso ${data.contestNumber}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Meu Trevo`,
      description,
      images: [image],
    },
  };
}

export default async function LotteryContestPage({ params }: ContestPageProps) {
  const { lottery, contestSlug } = await params;
  const data = await getContestRouteData(lottery, contestSlug);
  if (!data) notFound();

  const config = LOTTERY_SEO_CONFIGS[data.lotteryId];
  const result = data.result;
  const numbers = getResultNumbers(data.lotteryId, result);
  const recentResults = await getRecentLotteryResults(data.lotteryId, 30);
  const previousContest = recentResults.find(
    (recentResult) => recentResult.numero < result.numero
  );
  const canonical = `https://www.meutrevo.com${config.path}/concurso-${result.numero}`;
  const publishedDate = toIsoDate(result.dataApuracao);
  const rateio = (result.listaRateioPremio || []).filter(
    (item) => item.numeroDeGanhadores > 0 || item.valorPremio > 0
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: `Resultado ${config.name} Concurso ${result.numero}`,
        description: buildDescription(config.name, result, numbers),
        datePublished: publishedDate,
        dateModified: publishedDate,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': 'https://www.meutrevo.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: 'https://www.meutrevo.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: config.name,
            item: `https://www.meutrevo.com${config.path}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `Concurso ${result.numero}`,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <main
      className="contest-page"
      style={
        {
          '--contest-color': config.color,
          '--contest-glow': config.glowColor,
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="contest-shell">
        <header className="contest-header">
          <AppEntryLink href="/" className="contest-brand">
            <span aria-hidden="true">♣</span> Meu Trevo
          </AppEntryLink>
          <nav aria-label="Navegação principal">
            <AppEntryLink href={config.path}>
              Resultados da {config.name}
            </AppEntryLink>
            <AppEntryLink className="contest-app-link">
              Entrar no App
            </AppEntryLink>
          </nav>
        </header>

        <nav className="contest-breadcrumb" aria-label="Breadcrumb">
          <AppEntryLink href="/">Início</AppEntryLink>
          <span>/</span>
          <AppEntryLink href={config.path}>{config.name}</AppEntryLink>
          <span>/</span>
          <span>Concurso {result.numero}</span>
        </nav>

        <article>
          <section className="contest-hero">
            <div>
              <span className="contest-kicker">Resultado oficial</span>
              <h1>
                {config.name}: resultado do concurso {result.numero}
              </h1>
              <p>{config.contestIntro}</p>
              {publishedDate ? (
                <time dateTime={publishedDate}>
                  Sorteio de {result.dataApuracao}
                </time>
              ) : (
                <span>Data de apuração não informada</span>
              )}
            </div>

            <div className="contest-summary-card">
              <span>Próximo prêmio estimado</span>
              <strong>
                {formatCurrency(result.valorEstimadoProximoConcurso)}
              </strong>
              <small>
                {result.acumulado ? 'Concurso acumulado' : 'Houve premiação'}
              </small>
            </div>
          </section>

          <section
            className="contest-result"
            aria-labelledby="contest-numbers-title"
          >
            <div className="contest-section-heading">
              <div>
                <span>Concurso {result.numero}</span>
                <h2 id="contest-numbers-title">
                  {data.lotteryId === 'loteriafederal'
                    ? 'Bilhetes premiados'
                    : data.lotteryId === 'loteca'
                      ? 'Resultados dos jogos'
                      : 'Números sorteados'}
                </h2>
              </div>
              <span className="contest-official-badge">Fonte oficial</span>
            </div>

            {numbers.length > 0 ? (
              <div className="contest-numbers">
                {numbers.map((number, index) => (
                  <span
                    key={`${number}-${index}`}
                    className={
                      data.lotteryId === 'loteriafederal'
                        ? 'contest-number contest-ticket'
                        : 'contest-number'
                    }
                  >
                    {number}
                  </span>
                ))}
              </div>
            ) : (
              <p className="contest-empty-result">
                Os detalhes deste concurso ainda não foram disponibilizados pela
                fonte oficial. A página será atualizada automaticamente.
              </p>
            )}

            <dl className="contest-facts">
              <div>
                <dt>Data da apuração</dt>
                <dd>{result.dataApuracao || 'Não informada'}</dd>
              </div>
              <div>
                <dt>Próximo concurso</dt>
                <dd>{result.numeroConcursoProximo || result.numero + 1}</dd>
              </div>
              <div>
                <dt>Data prevista</dt>
                <dd>{result.dataProximoConcurso || 'A confirmar'}</dd>
              </div>
              <div>
                <dt>Local</dt>
                <dd>{result.localSorteio || 'Divulgação Caixa'}</dd>
              </div>
            </dl>
          </section>

          {result.trevosSorteados && result.trevosSorteados.length > 0 && (
            <section className="contest-extra">
              <h2>Trevos sorteados</h2>
              <p>{result.trevosSorteados.join(' e ')}</p>
            </section>
          )}

          <section
            className="contest-rateio"
            aria-labelledby="contest-rateio-title"
          >
            <h2 id="contest-rateio-title">Rateio e ganhadores</h2>
            {rateio.length > 0 ? (
              <div className="contest-rateio-list">
                {rateio.map((item) => (
                  <div key={`${item.faixa}-${item.descricaoFaixa}`}>
                    <strong>{item.descricaoFaixa}</strong>
                    <span>{item.numeroDeGanhadores} ganhador(es)</span>
                    <span>{formatCurrency(item.valorPremio)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>O rateio detalhado não foi informado para este concurso.</p>
            )}
          </section>

          <nav className="contest-actions" aria-label="Outros resultados">
            {previousContest && (
              <AppEntryLink
                href={`${config.path}/concurso-${previousContest.numero}`}
              >
                ← Concurso {previousContest.numero}
              </AppEntryLink>
            )}
            <AppEntryLink href={config.path}>
              Ver resultados da {config.name}
            </AppEntryLink>
          </nav>
        </article>
      </div>
    </main>
  );
}
