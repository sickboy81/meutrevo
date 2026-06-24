import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Sete - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado da Super Sete em tempo real, use nosso gerador de dezenas estatístico com volante de 7 colunas.',
  keywords: [
    'super sete',
    'resultado super sete',
    'gerador super sete',
    'simulador super sete',
    'meu trevo',
  ],
  alternates: { canonical: '/supersete' },
};

const props: LoteriaPageProps = {
  lotteryId: 'supersete',
  name: 'Super Sete',
  color: '#a4812e',
  glowColor: 'rgba(164, 129, 46, 0.4)',
  title: 'Gerador e Estatísticas da Super Sete',
  description:
    'Acompanhe resultados da Super Sete, a loteria de 7 colunas com 10 números cada. Use nosso gerador estatístico para montar suas apostas.',
  keywords: [
    'super sete',
    'resultado super sete',
    'gerador super sete',
    'simulador super sete',
    'meu trevo',
  ],
  canonical: '/supersete',
  fallbackNumbers: ['03', '15', '21', '34', '42', '56', '67'],
  probabilityText:
    'A Super Sete possui um volante com 7 colunas de 10 números cada (0 a 9). Você marca 1 número por coluna, totalizando 7 números. A chance de acertar todos os 7 números é de 1 em 10.000.000. Com o Meu Trevo, você analisa padrões entre as colunas.',
  sumRange: '— (formato colunas)',
  faq: [
    {
      question: 'Como funciona a Super Sete?',
      answer:
        'A Super Sete tem 7 colunas numeradas de 1 a 7, cada uma com 10 números (00 a 09). Você deve escolher 1 número por coluna, totalizando 7 números. São sorteados 7 números, um de cada coluna.',
    },
    {
      question: 'Quais as faixas de premiação?',
      answer:
        'Você ganha acertando 3, 4, 5, 6 ou 7 números. Cada coluna é independente, então a análise por coluna é fundamental.',
    },
  ],
  features: [
    {
      icon: '📊',
      title: 'Análise por Coluna',
      description:
        'Cada uma das 7 colunas tem suas próprias estatísticas de frequência e atraso.',
    },
    {
      icon: '⚡',
      title: 'Formato Especial',
      description:
        'Volante com 7 colunas de 10 números. Nosso gerador inteligente respeita esse formato único.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos',
      description:
        'Desdobramentos adaptados para o formato de colunas da Super Sete.',
    },
  ],
};

export default function SuperSeteLanding() {
  return <LoteriaLanding {...props} />;
}
