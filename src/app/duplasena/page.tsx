import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dupla Sena - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado da Dupla Sena em tempo real, use nosso gerador de dezenas estatístico e faça fechamentos matemáticos otimizados.',
  keywords: [
    'dupla sena',
    'resultado dupla sena',
    'gerador dupla sena',
    'simulador dupla sena',
    'meu trevo dupla sena',
  ],
  alternates: { canonical: '/duplasena' },
};

const props: LoteriaPageProps = {
  lotteryId: 'duplasena',
  name: 'Dupla Sena',
  color: '#a61324',
  glowColor: 'rgba(166, 19, 36, 0.4)',
  title: 'Gerador e Estatísticas da Dupla Sena',
  description:
    'Acompanhe resultados, simule dezenas históricas e use fechamentos combinatórios para potencializar seus jogos na loteria que sorteia duas vezes por concurso.',
  keywords: [
    'dupla sena',
    'resultado dupla sena',
    'gerador dupla sena',
    'simulador dupla sena',
    'meu trevo dupla sena',
  ],
  canonical: '/duplasena',
  fallbackNumbers: ['08', '15', '23', '31', '42', '49'],
  probabilityText:
    'A Dupla Sena possui 50 dezenas disponíveis na cartela, onde são sorteadas 6 dezenas em dois sorteios (1º e 2º). A chance de acertar a Sena no 1º sorteio com uma aposta simples de 6 números é de 1 em 15.890.700. Com o Meu Trevo, você pode analisar as tendências estatísticas antes de formular sua estratégia.',
  sumRange: '100 a 200',
  faq: [
    {
      question: 'Como funciona a Dupla Sena?',
      answer:
        'A Dupla Sena realiza dois sorteios por concurso. Você pode ganhar acertando 3, 4, 5 ou 6 números em qualquer um dos dois sorteios. Isso dobra suas chances comparado a loterias de sorteio único.',
    },
    {
      question: 'Qual a soma ideal para a Dupla Sena?',
      answer:
        'Estatisticamente, a soma das 6 dezenas sorteadas na Dupla Sena fica entre 100 e 200 na maioria dos concursos.',
    },
  ],
  features: [
    {
      icon: '📊',
      title: 'Dois Sorteios por Concurso',
      description:
        'Acompanhe os resultados do 1º e 2º sorteios com nossas ferramentas de análise estatística.',
    },
    {
      icon: '⚡',
      title: 'Soma Ponderada',
      description:
        'Mantenha a soma das suas dezenas entre 100 e 200 para aumentar a aderência estatística.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos Otimizados',
      description:
        'Gere cartões que garantem premiações na Dupla Sena com cobertura matemática.',
    },
  ],
};

export default function DuplaSenaLanding() {
  return <LoteriaLanding {...props} />;
}
