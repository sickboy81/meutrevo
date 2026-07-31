import type { Metadata } from 'next';

export type LotterySeoConfig = {
  id: string;
  path: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  color: string;
  glowColor: string;
  contestIntro: string;
};

export const LOTTERY_SEO_CONFIGS = {
  megasena: {
    id: 'megasena',
    path: '/megasena',
    name: 'Mega-Sena',
    title: 'Resultado da Mega-Sena e Gerador Estatístico',
    description:
      'Confira o resultado da Mega-Sena, dezenas sorteadas, prêmio e concursos recentes. Teste jogos e analise estatísticas antes de apostar.',
    keywords: [
      'resultado mega sena',
      'mega sena hoje',
      'gerador mega sena',
      'concurso mega sena',
      'estatísticas mega sena',
    ],
    color: '#209869',
    glowColor: 'rgba(32, 152, 105, 0.4)',
    contestIntro:
      'Consulte as dezenas oficiais, a data de apuração, o prêmio estimado e o rateio divulgado para este concurso da Mega-Sena.',
  },
  lotofacil: {
    id: 'lotofacil',
    path: '/lotofacil',
    name: 'Lotofácil',
    title: 'Resultado da Lotofácil e Gerador de Jogos',
    description:
      'Veja o resultado da Lotofácil, as 15 dezenas sorteadas, prêmio, rateio e concursos recentes. Teste jogos com estatísticas no Meu Trevo.',
    keywords: [
      'resultado lotofacil',
      'lotofacil hoje',
      'gerador lotofacil',
      'concurso lotofacil',
      'estatísticas lotofacil',
    ],
    color: '#93098f',
    glowColor: 'rgba(147, 9, 143, 0.4)',
    contestIntro:
      'Confira as 15 dezenas oficiais, a data do sorteio e a distribuição de prêmios deste concurso da Lotofácil.',
  },
  quina: {
    id: 'quina',
    path: '/quina',
    name: 'Quina',
    title: 'Resultado da Quina e Gerador Estatístico',
    description:
      'Acompanhe o resultado da Quina, números sorteados, prêmio, rateio e concursos recentes. Analise dezenas e teste jogos no Meu Trevo.',
    keywords: [
      'resultado quina',
      'quina hoje',
      'gerador quina',
      'concurso quina',
      'estatísticas quina',
    ],
    color: '#260085',
    glowColor: 'rgba(38, 0, 133, 0.4)',
    contestIntro:
      'Veja os cinco números oficiais, a data de apuração, o prêmio e o rateio informado para este concurso da Quina.',
  },
  lotomania: {
    id: 'lotomania',
    path: '/lotomania',
    name: 'Lotomania',
    title: 'Resultado da Lotomania e Estatísticas',
    description:
      'Confira o resultado da Lotomania, as 20 dezenas sorteadas, prêmio, rateio e concursos anteriores com dados oficiais e estatísticas.',
    keywords: [
      'resultado lotomania',
      'lotomania hoje',
      'concurso lotomania',
      'gerador lotomania',
      'estatísticas lotomania',
    ],
    color: '#f7941d',
    glowColor: 'rgba(247, 148, 29, 0.4)',
    contestIntro:
      'Consulte as 20 dezenas sorteadas, a data, a situação do prêmio e as faixas de premiação deste concurso da Lotomania.',
  },
  duplasena: {
    id: 'duplasena',
    path: '/duplasena',
    name: 'Dupla Sena',
    title: 'Resultado da Dupla Sena e Gerador de Jogos',
    description:
      'Confira o resultado da Dupla Sena, dezenas dos sorteios, prêmio, rateio e concursos recentes. Teste combinações no Meu Trevo.',
    keywords: [
      'resultado dupla sena',
      'dupla sena hoje',
      'concurso dupla sena',
      'gerador dupla sena',
    ],
    color: '#a61324',
    glowColor: 'rgba(166, 19, 36, 0.4)',
    contestIntro:
      'Acompanhe os números oficiais, a data de apuração e as faixas premiadas deste concurso da Dupla Sena.',
  },
  diadesorte: {
    id: 'diadesorte',
    path: '/diadesorte',
    name: 'Dia de Sorte',
    title: 'Resultado do Dia de Sorte e Gerador',
    description:
      'Veja o resultado do Dia de Sorte, sete dezenas, mês da sorte, prêmio e concursos recentes. Analise e teste combinações no Meu Trevo.',
    keywords: [
      'resultado dia de sorte',
      'dia de sorte hoje',
      'mês da sorte',
      'gerador dia de sorte',
    ],
    color: '#cb9e0c',
    glowColor: 'rgba(203, 158, 12, 0.4)',
    contestIntro:
      'Confira as sete dezenas, a data de apuração, o mês da sorte e o rateio deste concurso do Dia de Sorte.',
  },
  timemania: {
    id: 'timemania',
    path: '/timemania',
    name: 'Timemania',
    title: 'Resultado da Timemania e Gerador de Jogos',
    description:
      'Acompanhe o resultado da Timemania, dezenas, time do coração, prêmio e concursos recentes com dados oficiais e estatísticas.',
    keywords: [
      'resultado timemania',
      'timemania hoje',
      'time do coração',
      'gerador timemania',
    ],
    color: '#005b31',
    glowColor: 'rgba(0, 91, 49, 0.4)',
    contestIntro:
      'Consulte as dezenas sorteadas, o time do coração, a data e as faixas de premiação deste concurso da Timemania.',
  },
  maismilionaria: {
    id: 'maismilionaria',
    path: '/maismilionaria',
    name: '+Milionária',
    title: 'Resultado da +Milionária e Gerador de Jogos',
    description:
      'Confira o resultado da +Milionária, seis dezenas, trevos sorteados, prêmio, rateio e concursos recentes com dados oficiais.',
    keywords: [
      'resultado mais milionaria',
      '+milionaria hoje',
      'trevos sorteados',
      'gerador mais milionaria',
    ],
    color: '#1a3b8b',
    glowColor: 'rgba(26, 59, 139, 0.4)',
    contestIntro:
      'Veja as seis dezenas, os trevos oficiais, a data de apuração e o rateio deste concurso da +Milionária.',
  },
  supersete: {
    id: 'supersete',
    path: '/supersete',
    name: 'Super Sete',
    title: 'Resultado do Super Sete e Gerador',
    description:
      'Confira o resultado do Super Sete por coluna, prêmio, rateio e concursos recentes. Analise o histórico e teste jogos no Meu Trevo.',
    keywords: [
      'resultado super sete',
      'super sete hoje',
      'concurso super sete',
      'gerador super sete',
    ],
    color: '#a4812e',
    glowColor: 'rgba(164, 129, 46, 0.4)',
    contestIntro:
      'Confira o algarismo oficial de cada uma das sete colunas, a data e o rateio deste concurso do Super Sete.',
  },
  loteca: {
    id: 'loteca',
    path: '/loteca',
    name: 'Loteca',
    title: 'Resultado da Loteca e Palpites dos Jogos',
    description:
      'Veja o resultado da Loteca, placares dos 14 jogos, prognósticos, prêmio e concursos recentes com informações oficiais atualizadas.',
    keywords: [
      'resultado loteca',
      'loteca hoje',
      'jogos da loteca',
      'placares loteca',
      'concurso loteca',
    ],
    color: '#8b0000',
    glowColor: 'rgba(139, 0, 0, 0.4)',
    contestIntro:
      'Consulte a data, os resultados disponíveis dos 14 jogos e a premiação informada para este concurso da Loteca.',
  },
  loteriafederal: {
    id: 'loteriafederal',
    path: '/loteriafederal',
    name: 'Loteria Federal',
    title: 'Resultado da Federal e Bilhetes Premiados',
    description:
      'Confira o resultado da Loteria Federal, bilhetes premiados, extração, data e concursos recentes com dados oficiais atualizados.',
    keywords: [
      'resultado loteria federal',
      'federal hoje',
      'bilhetes premiados federal',
      'extração loteria federal',
    ],
    color: '#003366',
    glowColor: 'rgba(0, 51, 102, 0.4)',
    contestIntro:
      'Veja os bilhetes premiados, a data da extração e os dados oficiais disponíveis para este concurso da Loteria Federal.',
  },
} as const satisfies Record<string, LotterySeoConfig>;

export type LotterySeoId = keyof typeof LOTTERY_SEO_CONFIGS;

export const LOTTERY_SEO_LIST = Object.values(LOTTERY_SEO_CONFIGS);

export function isLotterySeoId(value: string): value is LotterySeoId {
  return Object.hasOwn(LOTTERY_SEO_CONFIGS, value);
}

export function createLotteryMetadata(lotteryId: LotterySeoId): Metadata {
  const config = LOTTERY_SEO_CONFIGS[lotteryId];
  const image = `/og/${lotteryId}`;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: { canonical: config.path },
    openGraph: {
      title: `${config.title} | Meu Trevo`,
      description: config.description,
      url: config.path,
      siteName: 'Meu Trevo',
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${config.name} no Meu Trevo`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.title} | Meu Trevo`,
      description: config.description,
      images: [image],
    },
  };
}
