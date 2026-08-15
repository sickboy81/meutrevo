import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StrategyWorkspace from '@/app/components/StrategyWorkspace';
import { STRATEGY_CATALOG, STRATEGY_IDS } from '@/lib/strategy-catalog';

type Props = { params: Promise<{ lottery: string }> };

export function generateStaticParams() {
  return STRATEGY_IDS.map((lottery) => ({ lottery }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lottery } = await params;
  const entry = STRATEGY_CATALOG[lottery];
  if (!entry) return { title: 'Estrategia de loteria' };
  return {
    title: `Estrategia da ${entry.name}`,
    description: `${entry.shortDescription} Veja criterios, limites e como planejar um jogo com transparencia.`,
    alternates: { canonical: `/estrategias/${entry.id}` },
  };
}

export default async function StrategyPage({ params }: Props) {
  const { lottery } = await params;
  const entry = STRATEGY_CATALOG[lottery];
  if (!entry) notFound();
  return <StrategyWorkspace entry={entry} />;
}
