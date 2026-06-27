import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Dia de Sorte - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado do Dia de Sorte em tempo real, use nosso gerador de dezenas estatístico e faça fechamentos combinatórios.',
  keywords: [
    'dia de sorte',
    'resultado dia de sorte',
    'gerador dia de sorte',
    'simulador dia de sorte',
    'meu trevo',
  ],
  alternates: { canonical: '/diadesorte' },
};

const props: LoteriaPageProps = {
  lotteryId: 'diadesorte',
  name: 'Dia de Sorte',
  color: '#cb9e0c',
  glowColor: 'rgba(203, 158, 12, 0.4)',
  title: 'Gerador e Estatísticas do Dia de Sorte',
  description:
    'Acompanhe resultados, simule dezenas históricas e use fechamentos matemáticos para potencializar seus jogos na loteria que sorteia 7 números por concurso.',
  keywords: [
    'dia de sorte',
    'resultado dia de sorte',
    'gerador dia de sorte',
    'simulador dia de sorte',
    'meu trevo',
  ],
  canonical: '/diadesorte',
  fallbackNumbers: ['02', '07', '13', '18', '22', '27', '31'],
  probabilityText:
    'O Dia de Sorte possui 31 dezenas disponíveis na cartela, onde são sorteadas 7 dezenas. A chance de acertar os 7 números com uma aposta simples de 7 números é de 1 em 2.629.575. Com o Meu Trevo, você pode analisar as tendências e montar suas estratégias.',
  sumRange: '80 a 145',
  faq: [
    {
      question: 'Como funciona o Dia de Sorte?',
      answer:
        "O Dia de Sorte sorteia 7 números dentre 31 disponíveis. Você pode ganhar acertando 4, 5, 6 ou 7 números. Além disso, há o sorteio de um 'Mês da Sorte' que pode premiar você.",
    },
    {
      question: 'Qual a soma ideal no Dia de Sorte?',
      answer:
        'A maioria dos sorteios tem soma total das 7 dezenas entre 80 e 145.',
    },
  ],
  features: [
    {
      icon: '📊',
      title: 'Análise Mensal',
      description:
        "Acompanhe a frequência dos números e também o 'Mês da Sorte' sorteado.",
    },
    {
      icon: '⚡',
      title: 'Soma Ideal',
      description:
        'Mantenha a soma das suas dezenas entre 80 e 145 para jogos mais alinhados com a média histórica.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos Inteligentes',
      description:
        'Use desdobramentos combinatórios para cobrir mais números com menos cartões.',
    },
  ],
};

export default function DiaDeSorteLanding() {
  return <LoteriaLanding {...props} />;
}
