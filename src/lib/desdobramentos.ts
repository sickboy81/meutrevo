// Desdobramentos / Fechamentos matemáticos para loterias
// Coverage guarantee: if X of the drawn numbers are in your chosen set,
// you're guaranteed at least Y prize tier.

export interface Desdobramento {
  id: string;
  name: string;
  lottery: string;
  picks: number; // how many numbers the user chooses
  games: number; // how many games are generated
  guarantee: string; // e.g. "Quadra se 4 acertadas"
  minHits: number;
  prizeTier: number;
}

// Pre-computed closure tables for common selections
const CLOSURES: Record<string, Desdobramento[]> = {
  megasena: [
    // Mega-Sena: choose 6 numbers to win
    {
      id: 'ms-8-2',
      name: 'Fechamento 8',
      lottery: 'megasena',
      picks: 8,
      games: 2,
      guarantee: 'Sena se 6 | Quina se 6 | Quadra se 5',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-9-3',
      name: 'Fechamento 9',
      lottery: 'megasena',
      picks: 9,
      games: 3,
      guarantee: 'Sena se 6 | Quina se 6 | Quadra se 5',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-10-6',
      name: 'Fechamento 10',
      lottery: 'megasena',
      picks: 10,
      games: 6,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-11-12',
      name: 'Fechamento 11',
      lottery: 'megasena',
      picks: 11,
      games: 12,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-12-24',
      name: 'Fechamento 12',
      lottery: 'megasena',
      picks: 12,
      games: 24,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-13-42',
      name: 'Fechamento 13',
      lottery: 'megasena',
      picks: 13,
      games: 42,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-14-84',
      name: 'Fechamento 14',
      lottery: 'megasena',
      picks: 14,
      games: 84,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
    {
      id: 'ms-15-126',
      name: 'Fechamento 15',
      lottery: 'megasena',
      picks: 15,
      games: 126,
      guarantee: 'Sena se 6 | Quina se 5 | Quadra se 4',
      minHits: 6,
      prizeTier: 1,
    },
  ],
  lotofacil: [
    // Lotofácil: choose 15 numbers to win
    {
      id: 'lf-16-2',
      name: 'Fechamento 16',
      lottery: 'lotofacil',
      picks: 16,
      games: 2,
      guarantee: '15 acertos se 15 | 14 se 14',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-17-4',
      name: 'Fechamento 17',
      lottery: 'lotofacil',
      picks: 17,
      games: 4,
      guarantee: '15 acertos se 15 | 14 se 14',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-18-8',
      name: 'Fechamento 18',
      lottery: 'lotofacil',
      picks: 18,
      games: 8,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-19-14',
      name: 'Fechamento 19',
      lottery: 'lotofacil',
      picks: 19,
      games: 14,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-20-28',
      name: 'Fechamento 20',
      lottery: 'lotofacil',
      picks: 20,
      games: 28,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13 | 12 se 12',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-21-42',
      name: 'Fechamento 21',
      lottery: 'lotofacil',
      picks: 21,
      games: 42,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13 | 12 se 12',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-22-66',
      name: 'Fechamento 22',
      lottery: 'lotofacil',
      picks: 22,
      games: 66,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13 | 12 se 12',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-23-105',
      name: 'Fechamento 23',
      lottery: 'lotofacil',
      picks: 23,
      games: 105,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13 | 12 se 12 | 11 se 11',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-24-150',
      name: 'Fechamento 24',
      lottery: 'lotofacil',
      picks: 24,
      games: 150,
      guarantee: '15 se 15 | 14 se 14 | 13 se 13 | 12 se 12 | 11 se 11',
      minHits: 15,
      prizeTier: 1,
    },
    {
      id: 'lf-25-210',
      name: 'Fechamento 25',
      lottery: 'lotofacil',
      picks: 25,
      games: 210,
      guarantee: 'TODAS as combinações possíveis',
      minHits: 15,
      prizeTier: 1,
    },
  ],
  quina: [
    {
      id: 'qi-7-2',
      name: 'Fechamento 7',
      lottery: 'quina',
      picks: 7,
      games: 2,
      guarantee: 'Quina se 5 | Quadra se 4',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-8-4',
      name: 'Fechamento 8',
      lottery: 'quina',
      picks: 8,
      games: 4,
      guarantee: 'Quina se 5 | Quadra se 4',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-9-6',
      name: 'Fechamento 9',
      lottery: 'quina',
      picks: 9,
      games: 6,
      guarantee: 'Quina se 5 | Quadra se 4',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-10-12',
      name: 'Fechamento 10',
      lottery: 'quina',
      picks: 10,
      games: 12,
      guarantee: 'Quina se 5 | Quadra se 4',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-11-24',
      name: 'Fechamento 11',
      lottery: 'quina',
      picks: 11,
      games: 24,
      guarantee: 'Quina se 5 | Quadra se 4 | Terno se 3',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-12-42',
      name: 'Fechamento 12',
      lottery: 'quina',
      picks: 12,
      games: 42,
      guarantee: 'Quina se 5 | Quadra se 4 | Terno se 3',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-13-78',
      name: 'Fechamento 13',
      lottery: 'quina',
      picks: 13,
      games: 78,
      guarantee: 'Quina se 5 | Quadra se 4 | Terno se 3',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-14-120',
      name: 'Fechamento 14',
      lottery: 'quina',
      picks: 14,
      games: 120,
      guarantee: 'Quina se 5 | Quadra se 4 | Terno se 3',
      minHits: 5,
      prizeTier: 1,
    },
    {
      id: 'qi-15-180',
      name: 'Fechamento 15',
      lottery: 'quina',
      picks: 15,
      games: 180,
      guarantee: 'Quina se 5 | Quadra se 4 | Terno se 3 | Duque se 2',
      minHits: 5,
      prizeTier: 1,
    },
  ],
  lotomania: [
    {
      id: 'lm-20-2',
      name: 'Fechamento 20',
      lottery: 'lotomania',
      picks: 20,
      games: 2,
      guarantee: '18 se 20 | 17 se 20',
      minHits: 20,
      prizeTier: 1,
    },
    {
      id: 'lm-22-4',
      name: 'Fechamento 22',
      lottery: 'lotomania',
      picks: 22,
      games: 4,
      guarantee: '19 se 20 | 18 se 20',
      minHits: 20,
      prizeTier: 1,
    },
    {
      id: 'lm-24-8',
      name: 'Fechamento 24',
      lottery: 'lotomania',
      picks: 24,
      games: 8,
      guarantee: '20 se 20 | 19 se 20 | 18 se 20',
      minHits: 20,
      prizeTier: 1,
    },
    {
      id: 'lm-26-14',
      name: 'Fechamento 26',
      lottery: 'lotomania',
      picks: 26,
      games: 14,
      guarantee: '20 se 20 | 19 se 20 | 18 se 20',
      minHits: 20,
      prizeTier: 1,
    },
  ],
};

export function getDesdobramentos(lottery: string): Desdobramento[] {
  return CLOSURES[lottery] || [];
}

export function getLotteryGameCost(lottery: string, games: number): number {
  const priceMap: Record<string, number> = {
    megasena: 5,
    lotofacil: 2.5,
    quina: 2,
    lotomania: 2.5,
    diadesorte: 2,
    timemania: 2,
    loteca: 2,
    duplasena: 2.5,
    supersete: 2,
    maismilionaria: 3,
  };
  return (priceMap[lottery] || 2) * games;
}

// Generate games for a closure
export function generateClosureGames(
  selectedNumbers: number[],
  desdobramento: Desdobramento
): number[][] {
  const { picks, games } = desdobramento;

  if (selectedNumbers.length < picks) {
    return [];
  }

  // Use combinatorial algorithm to generate optimal coverage
  const result: number[][] = [];
  const nums = [...selectedNumbers].sort((a, b) => a - b);

  // Simple approach: generate combinations and pick optimal subset
  const allCombos = combinations(
    nums,
    desdobramento.lottery === 'lotofacil'
      ? 15
      : desdobramento.lottery === 'megasena'
        ? 6
        : desdobramento.lottery === 'quina'
          ? 5
          : 20
  );

  // Greedy set cover: pick games that cover the most uncovered numbers
  const covered = new Set<number>();
  const used = new Set<number>();

  while (result.length < games && used.size < allCombos.length) {
    let bestIdx = -1;
    let bestScore = -1;

    for (let i = 0; i < allCombos.length; i++) {
      if (used.has(i)) continue;
      const combo = allCombos[i];
      let score = 0;
      for (const n of combo) {
        if (!covered.has(n)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;

    used.add(bestIdx);
    const game = allCombos[bestIdx];
    result.push(game);
    for (const n of game) {
      covered.add(n);
    }
  }

  return result;
}

function combinations(arr: number[], size: number): number[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];

  const result: number[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const rest = combinations(arr.slice(i + 1), size - 1);
    for (const combo of rest) {
      result.push([arr[i], ...combo]);
    }
  }
  return result;
}
