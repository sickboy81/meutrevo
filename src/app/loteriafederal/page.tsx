import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import { createLotteryMetadata } from '@/lib/lottery-seo';

export const revalidate = 300;
export const metadata = createLotteryMetadata('loteriafederal');

const props: LoteriaPageProps = {
  lotteryId: 'loteriafederal',
  name: 'Loteria Federal',
  color: '#003366',
  glowColor: 'rgba(0, 51, 102, 0.4)',
  title: 'Resultados e Extrações da Loteria Federal',
  description:
    'Confira os bilhetes premiados da Loteria Federal, a data da extração, o concurso e os resultados recentes divulgados oficialmente.',
  keywords: [
    'resultado loteria federal',
    'federal hoje',
    'bilhetes premiados',
    'extração federal',
  ],
  canonical: '/loteriafederal',
  fallbackNumbers: [],
  probabilityText:
    'Na Loteria Federal, o apostador adquire um bilhete já numerado. As extrações definem os bilhetes premiados, e também existem faixas derivadas por aproximação, centena, dezena e unidade conforme as regras oficiais.',
  sumRange: '5 prêmios principais',
  showSimulator: false,
  ctaTitle: 'Acompanhe as extrações da Loteria Federal',
  ctaDescription:
    'Consulte os bilhetes premiados e navegue pelas páginas dos concursos recentes em um só lugar.',
  proofItems: [
    { label: 'Bilhetes', text: 'premiados' },
    { label: 'Extrações', text: 'recentes' },
    { label: 'Dados', text: 'oficiais' },
  ],
  faq: [
    {
      question: 'Como funciona a Loteria Federal?',
      answer:
        'Na Loteria Federal, os bilhetes são vendidos já numerados. O sorteio define os números premiados e as faixas previstas no plano da extração.',
    },
    {
      question: 'O Meu Trevo vende bilhetes da Loteria Federal?',
      answer:
        'Não. O Meu Trevo apenas organiza e apresenta resultados. Bilhetes e apostas são comercializados pelos canais autorizados da Caixa.',
    },
  ],
  features: [
    {
      icon: '🎟️',
      title: 'Bilhetes Premiados',
      description:
        'Visualize os números dos principais prêmios divulgados em cada extração.',
    },
    {
      icon: '📅',
      title: 'Histórico de Extrações',
      description: 'Acesse concursos recentes por número e data de apuração.',
    },
    {
      icon: '🏛️',
      title: 'Fonte Oficial',
      description:
        'Dados apresentados a partir das informações publicadas pela Caixa.',
    },
  ],
};

export default function LoteriaFederalLanding() {
  return <LoteriaLanding {...props} />;
}
