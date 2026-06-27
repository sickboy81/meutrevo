import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '+Milionária - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado da +Milionária em tempo real, use nosso gerador de dezenas estatístico e trevos da sorte.',
  keywords: [
    'mais milionaria',
    'resultado +milionaria',
    'gerador +milionaria',
    'simulador +milionaria',
    'meu trevo',
  ],
  alternates: { canonical: '/maismilionaria' },
};

const props: LoteriaPageProps = {
  lotteryId: 'maismilionaria',
  name: '+Milionária',
  color: '#1a3b8b',
  glowColor: 'rgba(26, 59, 139, 0.4)',
  title: 'Gerador e Estatísticas da +Milionária',
  description:
    'Acompanhe resultados, simule dezenas históricas e use fechamentos combinatórios na loteria que paga milhões com trevos da sorte.',
  keywords: [
    'mais milionaria',
    'resultado +milionaria',
    'gerador +milionaria',
    'simulador +milionaria',
    'meu trevo',
  ],
  canonical: '/maismilionaria',
  fallbackNumbers: ['06', '14', '23', '31', '42', '49'],
  probabilityText:
    'A +Milionária possui 50 dezenas disponíveis na cartela, onde são sorteadas 6 dezenas. Você também escolhe 2 trevos entre 6 disponíveis. A chance de acertar os 6 números + 2 trevos é de 1 em 238.000.000. Com o Meu Trevo, você analisa padrões e otimiza suas apostas.',
  sumRange: '110 a 190',
  faq: [
    {
      question: 'Como funciona a +Milionária?',
      answer:
        'A +Milionária sorteia 6 números dentre 50 disponíveis e 2 trevos dentre 6. Você ganha acertando de 2 a 6 números e de 0 a 2 trevos, em diversas faixas de premiação.',
    },
    {
      question: 'O que são os Trevos da Sorte?',
      answer:
        'Os Trevos são números especiais de 1 a 6. Você escolhe 2 trevos por aposta. Acertar os trevos pode multiplicar seus ganhos.',
    },
  ],
  features: [
    {
      icon: '📊',
      title: 'Dezenas + Trevos',
      description: 'Análise combinada das 6 dezenas sorteadas e dos 2 trevos.',
    },
    {
      icon: '⚡',
      title: 'Soma Ponderada',
      description:
        'Mantenha a soma das 6 dezenas entre 110 e 190 para maior aderência estatística.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos Otimizados',
      description:
        'Desdobramentos que consideram tanto as dezenas quanto os trevos.',
    },
  ],
};

export default function MaisMilionariaLanding() {
  return <LoteriaLanding {...props} />;
}
