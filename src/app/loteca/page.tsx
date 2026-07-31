import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import { createLotteryMetadata } from '@/lib/lottery-seo';

// Loteca scores can be enriched after the contest metadata is published.
// Keep this page dynamic so ISR cannot preserve an empty result indefinitely.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = createLotteryMetadata('loteca');

const props: LoteriaPageProps = {
  lotteryId: 'loteca',
  name: 'Loteca',
  color: '#8b0000',
  glowColor: 'rgba(139, 0, 0, 0.4)',
  title: 'Resultados e Concursos da Loteca',
  description:
    'Acompanhe os concursos da Loteca, confira resultados, placares disponíveis e informações oficiais sobre a premiação dos 14 jogos.',
  keywords: [
    'resultado loteca',
    'loteca hoje',
    'jogos loteca',
    'placares loteca',
  ],
  canonical: '/loteca',
  fallbackNumbers: [],
  probabilityText:
    'Na Loteca, o apostador indica vitória do time da casa, empate ou vitória do visitante em 14 partidas. Como os resultados dependem de eventos esportivos, o Meu Trevo apresenta os dados oficiais disponíveis sem prometer previsão de placares.',
  sumRange: '14 prognósticos',
  showSimulator: false,
  ctaTitle: 'Organize seus acompanhamentos da Loteca',
  ctaDescription:
    'Consulte concursos recentes e mantenha seus jogos e resultados organizados no painel do Meu Trevo.',
  proofItems: [
    { label: '14 jogos', text: 'por concurso' },
    { label: 'Placares', text: 'atualizados' },
    { label: 'Histórico', text: 'de concursos' },
  ],
  faq: [
    {
      question: 'Como funciona a Loteca?',
      answer:
        'A Loteca reúne 14 partidas. Em cada jogo, a aposta indica vitória da equipe da casa, empate ou vitória da equipe visitante.',
    },
    {
      question: 'Quando o resultado da Loteca é atualizado?',
      answer:
        'O resultado é atualizado após a consolidação dos placares e a divulgação oficial do concurso pela Caixa.',
    },
  ],
  features: [
    {
      icon: '⚽',
      title: 'Resultados dos 14 Jogos',
      description:
        'Consulte o concurso e os resultados disponibilizados para cada rodada.',
    },
    {
      icon: '📅',
      title: 'Concursos Recentes',
      description:
        'Navegue pelo histórico recente com páginas próprias para cada concurso.',
    },
    {
      icon: '📊',
      title: 'Premiação Oficial',
      description:
        'Acompanhe o prêmio estimado e as informações de rateio quando divulgadas.',
    },
  ],
};

export default function LotecaLanding() {
  return <LoteriaLanding {...props} />;
}
