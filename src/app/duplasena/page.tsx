import LoteriaLanding, { LoteriaPageProps } from '../components/LoteriaLanding';
import { createLotteryMetadata } from '@/lib/lottery-seo';

export const revalidate = 300;

export const metadata = createLotteryMetadata('duplasena');

const props: LoteriaPageProps = {
  lotteryId: 'duplasena',
  name: 'Dupla Sena',
  color: '#a61324',
  glowColor: 'rgba(166, 19, 36, 0.4)',
  title: 'Gerador e Estatísticas da Dupla Sena',
  description:
    'Acompanhe resultados, simule dezenas históricas e use fechamentos combinatórios para organizar seus jogos na loteria que sorteia duas vezes por concurso.',
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
    'A Dupla Sena possui 50 dezenas e realiza dois sorteios por concurso. O Meu Trevo organiza os resultados, custos e critérios históricos para você revisar seus jogos sem transformar histórico em previsão.',
  sumRange: '100 a 200',
  faq: [
    {
      question: 'Como funciona a Dupla Sena?',
      answer:
        'A Dupla Sena realiza dois sorteios por concurso. Você pode ganhar acertando 3, 4, 5 ou 6 números em qualquer um dos dois sorteios. Isso dobra suas chances comparado a loterias de sorteio único.',
    },
    {
      question: 'Qual a faixa histórica de soma para a Dupla Sena?',
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
        'Compare a soma das suas dezenas com a faixa histórica de 100 a 200 como referência descritiva, sem promessa de vantagem.',
    },
    {
      icon: '🔮',
      title: 'Fechamentos combinatórios',
      description:
        'Distribua combinações com cobertura condicional e consulte claramente os limites de cada fechamento.',
    },
  ],
};

export default function DuplaSenaLanding() {
  return <LoteriaLanding {...props} />;
}
