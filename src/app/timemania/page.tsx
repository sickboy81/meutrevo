import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Timemania - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado da Timemania em tempo real, use nosso gerador de dezenas estatístico e fechamentos combinatórios.',
  keywords: [
    'timemania',
    'resultado timemania',
    'gerador timemania',
    'simulador timemania',
    'meu trevo timemania',
  ],
  alternates: { canonical: '/timemania' },
};

const props: LoteriaPageProps = {
  lotteryId: 'timemania',
  name: 'Timemania',
  color: '#005b31',
  glowColor: 'rgba(0, 91, 49, 0.4)',
  title: 'Gerador e Estatísticas da Timemania',
  description:
    'Acompanhe resultados, simule dezenas históricas e use fechamentos combinatórios para potencializar seus jogos na loteria dos times do coração.',
  keywords: [
    'timemania',
    'resultado timemania',
    'gerador timemania',
    'simulador timemania',
    'meu trevo timemania',
  ],
  canonical: '/timemania',
  fallbackNumbers: ['05', '14', '27', '33', '41', '52', '63', '71', '78', '80'],
  probabilityText:
    "A Timemania possui 80 dezenas disponíveis na cartela, onde são sorteadas 10 dezenas. Você também escolhe um 'Time do Coração'. A chance de acertar os 7 números com uma aposta simples é de 1 em 9.234. Com o Meu Trevo, você potencializa suas análises.",
  sumRange: '320 a 480',
  faq: [
    {
      question: 'Como funciona a Timemania?',
      answer:
        'Na Timemania são sorteados 10 números dentre 80 disponíveis. Você escolhe de 7 a 10 números e também um Time do Coração. Ganha acertando 3, 4, 5, 6 ou 7 números.',
    },
    {
      question: 'Qual a soma ideal na Timemania?',
      answer:
        'A soma das 10 dezenas sorteadas geralmente fica entre 320 e 480.',
    },
  ],
  features: [
    {
      icon: '📊',
      title: 'Time do Coração',
      description:
        'Além das dezenas, acompanhe a estatística dos times mais sorteados.',
    },
    {
      icon: '⚡',
      title: '10 Dezenas por Sorteio',
      description:
        'Com 10 números sorteados, as chances de acerto são maiores. Use nossos filtros para otimizar.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos para Timemania',
      description: 'Cubra mais números com nossos desdobramentos inteligentes.',
    },
  ],
};

export default function TimemaniaLanding() {
  return <LoteriaLanding {...props} />;
}
