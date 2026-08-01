export type LotofacilDrawLike = {
  listaDezenas?: string[];
  dezenasSorteadasOrdemSorteio?: string[];
};

type FrequencyMap = Record<number, number>;
type NumberGroup = 'hot' | 'neutral' | 'cold';

export type LotofacilAnalysis = {
  drawCount: number;
  frequencies: {
    full: FrequencyMap;
    last100: FrequencyMap;
    last30: FrequencyMap;
    last10: FrequencyMap;
  };
  delays: FrequencyMap;
  repeatRange: { min: number; max: number };
  sumRange: { min: number; max: number; median: number };
  parity: { even: number; odd: number };
  borderRange: { min: number; max: number };
  rowRange: { min: number; max: number };
  columnRange: { min: number; max: number };
  sequenceRange: { min: number; max: number };
  topPairs: { numbers: [number, number]; count: number }[];
  topTriads: { numbers: [number, number, number]; count: number }[];
  groups: Record<number, NumberGroup>;
};

export type LotofacilGame = {
  label: 'Jogo 1' | 'Jogo 2' | 'Jogo 3';
  numbers: number[];
  even: number;
  odd: number;
  border: number;
  center: number;
  sum: number;
  repeats: number;
  maxSequence: number;
};

export type LotofacilStrategyResult = {
  analysis: LotofacilAnalysis;
  games: LotofacilGame[];
};

type BacktestMethod = {
  averageHits: number;
  hits: Record<11 | 12 | 13 | 14 | 15, number>;
};

export type LotofacilBacktestResult = {
  contests: number;
  strategy: BacktestMethod;
  random: BacktestMethod;
  averageDifference: number;
  pValue: number;
  statisticallyRelevant: boolean;
  conclusion: string;
};

const NUMBERS = Array.from({ length: 25 }, (_, index) => index + 1);

function extractNumbers(draw: LotofacilDrawLike | number[]): number[] {
  if (Array.isArray(draw)) {
    return Array.from(
      new Set(
        draw.filter(
          (number) => Number.isInteger(number) && number >= 1 && number <= 25
        )
      )
    ).sort((a, b) => a - b);
  }
  return Array.from(
    new Set(
      (draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || [])
        .map(Number)
        .filter(
          (number) => Number.isInteger(number) && number >= 1 && number <= 25
        )
    )
  ).sort((a, b) => a - b);
}

function validHistory(
  history: Array<LotofacilDrawLike | number[]>
): number[][] {
  return history.map(extractNumbers).filter((numbers) => numbers.length === 15);
}

function createFrequency(draws: number[][]): FrequencyMap {
  const frequency: FrequencyMap = Object.fromEntries(
    NUMBERS.map((number) => [number, 0])
  );
  draws.forEach((draw) => draw.forEach((number) => (frequency[number] += 1)));
  return frequency;
}

function quantile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return Math.round(
    sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
  );
}

function borderCount(numbers: number[]): number {
  return numbers.filter((number) => {
    const row = Math.floor((number - 1) / 5);
    const column = (number - 1) % 5;
    return row === 0 || row === 4 || column === 0 || column === 4;
  }).length;
}

function gridLoads(numbers: number[]): { rows: number[]; columns: number[] } {
  const rows = Array.from({ length: 5 }, () => 0);
  const columns = Array.from({ length: 5 }, () => 0);
  numbers.forEach((number) => {
    rows[Math.floor((number - 1) / 5)] += 1;
    columns[(number - 1) % 5] += 1;
  });
  return { rows, columns };
}

function maxSequence(numbers: number[]): number {
  let current = 0;
  let max = 0;
  let previous = 0;
  numbers.forEach((number) => {
    current = number === previous + 1 ? current + 1 : 1;
    previous = number;
    max = Math.max(max, current);
  });
  return max;
}

function overlap(first: number[], second: number[]): number {
  const lookup = new Set(first);
  return second.filter((number) => lookup.has(number)).length;
}

function buildCooccurrences(draws: number[][]) {
  const pairs: Record<string, number> = {};
  const triads: Record<string, number> = {};
  draws.forEach((draw) => {
    for (let first = 0; first < draw.length; first += 1) {
      for (let second = first + 1; second < draw.length; second += 1) {
        const pairKey = `${draw[first]}-${draw[second]}`;
        pairs[pairKey] = (pairs[pairKey] || 0) + 1;
        for (let third = second + 1; third < draw.length; third += 1) {
          const triadKey = `${draw[first]}-${draw[second]}-${draw[third]}`;
          triads[triadKey] = (triads[triadKey] || 0) + 1;
        }
      }
    }
  });
  return { pairs, triads };
}

function makeGroups(
  recentFrequency: FrequencyMap
): Record<number, NumberGroup> {
  const ranked = [...NUMBERS].sort(
    (left, right) =>
      recentFrequency[right] - recentFrequency[left] || left - right
  );
  const groups = {} as Record<number, NumberGroup>;
  ranked.forEach((number, index) => {
    groups[number] = index < 8 ? 'hot' : index >= 17 ? 'cold' : 'neutral';
  });
  return groups;
}

function deriveRepeatRange(draws: number[][]): { min: number; max: number } {
  const repeats = draws
    .slice(0, -1)
    .map((draw, index) => overlap(draw, draws[index + 1]));
  if (repeats.length === 0) return { min: 8, max: 10 };
  return {
    min: Math.max(0, quantile(repeats, 0.2)),
    max: Math.min(15, quantile(repeats, 0.8)),
  };
}

export function analyzeLotofacilHistory(
  history: Array<LotofacilDrawLike | number[]>
): LotofacilAnalysis {
  const draws = validHistory(history);
  const sums = draws.map((draw) =>
    draw.reduce((total, number) => total + number, 0)
  );
  const borders = draws.map(borderCount);
  const sequences = draws.map(maxSequence);
  const rowLoads = draws.flatMap((draw) => gridLoads(draw).rows);
  const columnLoads = draws.flatMap((draw) => gridLoads(draw).columns);
  const parity = draws.reduce(
    (total, draw) => {
      total.even += draw.filter((number) => number % 2 === 0).length;
      total.odd += draw.filter((number) => number % 2 !== 0).length;
      return total;
    },
    { even: 0, odd: 0 }
  );
  const delays: FrequencyMap = Object.fromEntries(
    NUMBERS.map((number) => [number, draws.length])
  );
  draws.forEach((draw, index) =>
    draw.forEach((number) => {
      if (delays[number] === draws.length) delays[number] = index;
    })
  );
  const { pairs, triads } = buildCooccurrences(draws);
  const toTopPairs = Object.entries(pairs)
    .map(([key, count]) => ({
      numbers: key.split('-').map(Number) as [number, number],
      count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.numbers[0] - right.numbers[0]
    )
    .slice(0, 12);
  const toTopTriads = Object.entries(triads)
    .map(([key, count]) => ({
      numbers: key.split('-').map(Number) as [number, number, number],
      count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || left.numbers[0] - right.numbers[0]
    )
    .slice(0, 12);
  const last100 = draws.slice(0, 100);
  const last30 = draws.slice(0, 30);
  const last10 = draws.slice(0, 10);
  const recentFrequency = createFrequency(last30.length > 0 ? last30 : draws);

  return {
    drawCount: draws.length,
    frequencies: {
      full: createFrequency(draws),
      last100: createFrequency(last100),
      last30: createFrequency(last30),
      last10: createFrequency(last10),
    },
    delays,
    repeatRange: deriveRepeatRange(draws),
    sumRange: {
      min: quantile(sums, 0.25),
      max: quantile(sums, 0.75),
      median: quantile(sums, 0.5),
    },
    parity,
    borderRange: { min: quantile(borders, 0.2), max: quantile(borders, 0.8) },
    rowRange: { min: quantile(rowLoads, 0.1), max: quantile(rowLoads, 0.9) },
    columnRange: {
      min: quantile(columnLoads, 0.1),
      max: quantile(columnLoads, 0.9),
    },
    sequenceRange: {
      min: quantile(sequences, 0.15),
      max: quantile(sequences, 0.85),
    },
    topPairs: toTopPairs,
    topTriads: toTopTriads,
    groups: makeGroups(recentFrequency),
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(
  available: number[],
  weights: Record<number, number>,
  random: () => number
): number {
  const total = available.reduce(
    (sum, number) => sum + Math.max(0.01, weights[number]),
    0
  );
  let cursor = random() * total;
  for (const number of available) {
    cursor -= Math.max(0.01, weights[number]);
    if (cursor <= 0) return number;
  }
  return available[available.length - 1];
}

function candidateWeight(
  number: number,
  analysis: LotofacilAnalysis,
  groupTargets: Record<NumberGroup, number>,
  selected: number[]
): number {
  const group = analysis.groups[number];
  const selectedInGroup = selected.filter(
    (item) => analysis.groups[item] === group
  ).length;
  const full = analysis.frequencies.full[number] || 0;
  const recent100 = analysis.frequencies.last100[number] || 0;
  const recent30 = analysis.frequencies.last30[number] || 0;
  const recent10 = analysis.frequencies.last10[number] || 0;
  const delay = analysis.delays[number] || 0;
  const frequencyScore =
    full * 0.2 + recent100 * 0.25 + recent30 * 0.8 + recent10 * 1.15;
  const delayBonus = Math.min(4, delay * 0.18);
  const groupBonus = selectedInGroup < groupTargets[group] ? 6 : 0.35;
  return 1 + frequencyScore + delayBonus + groupBonus;
}

function meetsStructure(
  numbers: number[],
  analysis: LotofacilAnalysis,
  parityTarget: number,
  previousDraw: number[]
): boolean {
  const even = numbers.filter((number) => number % 2 === 0).length;
  const border = borderCount(numbers);
  const sum = numbers.reduce((total, number) => total + number, 0);
  const { rows, columns } = gridLoads(numbers);
  const repeats = overlap(numbers, previousDraw);
  return (
    even === parityTarget &&
    border >= 9 &&
    border <= 11 &&
    sum >= analysis.sumRange.min &&
    sum <= analysis.sumRange.max &&
    rows.every((count) => count >= 2 && count <= 4) &&
    columns.every((count) => count >= 2 && count <= 4) &&
    repeats >= analysis.repeatRange.min &&
    repeats <= analysis.repeatRange.max
  );
}

function candidateScore(
  numbers: number[],
  analysis: LotofacilAnalysis
): number {
  const pairLookup = new Map(
    analysis.topPairs.map((pair) => [pair.numbers.join('-'), pair.count])
  );
  const triadLookup = new Map(
    analysis.topTriads.map((triad) => [triad.numbers.join('-'), triad.count])
  );
  const set = new Set(numbers);
  let score = numbers.reduce(
    (total, number) =>
      total +
      (analysis.frequencies.last30[number] || 0) +
      (analysis.frequencies.last10[number] || 0) * 1.5,
    0
  );
  pairLookup.forEach((count, key) => {
    const [first, second] = key.split('-').map(Number);
    if (set.has(first) && set.has(second)) score += count * 0.7;
  });
  triadLookup.forEach((count, key) => {
    const [first, second, third] = key.split('-').map(Number);
    if (set.has(first) && set.has(second) && set.has(third))
      score += count * 0.35;
  });
  score -=
    Math.abs(
      numbers.reduce((sum, number) => sum + number, 0) -
        analysis.sumRange.median
    ) * 0.08;
  score -=
    Math.abs(
      maxSequence(numbers) -
        Math.min(5, Math.max(2, analysis.sequenceRange.max))
    ) * 0.8;
  return score;
}

function createGame(
  label: LotofacilGame['label'],
  analysis: LotofacilAnalysis,
  previousDraw: number[],
  parityTarget: number,
  groupTargets: Record<NumberGroup, number>,
  avoid: number[][],
  seed: number,
  attempts = 4000
): LotofacilGame | null {
  const random = seededRandom(seed);
  let best: number[] | null = null;
  let bestScore = -Infinity;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const selected: number[] = [];
    while (selected.length < 15) {
      const available = NUMBERS.filter((number) => !selected.includes(number));
      const weights = Object.fromEntries(
        available.map((number) => [
          number,
          candidateWeight(number, analysis, groupTargets, selected),
        ])
      );
      selected.push(pickWeighted(available, weights, random));
    }
    const numbers = selected.sort((left, right) => left - right);
    if (
      !meetsStructure(numbers, analysis, parityTarget, previousDraw) ||
      avoid.some((game) => overlap(game, numbers) > 12)
    )
      continue;
    const score = candidateScore(numbers, analysis);
    if (score > bestScore) {
      best = numbers;
      bestScore = score;
    }
  }
  if (!best) return null;
  const even = best.filter((number) => number % 2 === 0).length;
  const border = borderCount(best);
  return {
    label,
    numbers: best,
    even,
    odd: 15 - even,
    border,
    center: 15 - border,
    sum: best.reduce((total, number) => total + number, 0),
    repeats: overlap(best, previousDraw),
    maxSequence: maxSequence(best),
  };
}

export function generateLotofacilStrategy(
  history: Array<LotofacilDrawLike | number[]>,
  attempts = 4000
): LotofacilStrategyResult | null {
  const draws = validHistory(history);
  if (draws.length < 10) return null;
  const analysis = analyzeLotofacilHistory(draws);
  const seed = draws[0].reduce(
    (total, number) => total * 31 + number,
    draws.length
  );
  const definitions: {
    label: LotofacilGame['label'];
    even: number;
    groups: Record<NumberGroup, number>;
  }[] = [
    { label: 'Jogo 1', even: 8, groups: { hot: 6, neutral: 6, cold: 3 } },
    { label: 'Jogo 2', even: 7, groups: { hot: 5, neutral: 7, cold: 3 } },
    { label: 'Jogo 3', even: 7, groups: { hot: 6, neutral: 5, cold: 4 } },
  ];
  const games: LotofacilGame[] = [];
  for (const [index, definition] of definitions.entries()) {
    const game = createGame(
      definition.label,
      analysis,
      draws[0],
      definition.even,
      definition.groups,
      games.map((item) => item.numbers),
      seed + index * 104729,
      attempts
    );
    if (!game) return null;
    games.push(game);
  }
  return { analysis, games };
}

function randomGame(random: () => number): number[] {
  return [...NUMBERS]
    .sort(() => random() - 0.5)
    .slice(0, 15)
    .sort((left, right) => left - right);
}

function initializeMethod(): BacktestMethod {
  return { averageHits: 0, hits: { 11: 0, 12: 0, 13: 0, 14: 0, 15: 0 } };
}

function addHits(method: BacktestMethod, hits: number): void {
  method.averageHits += hits;
  if (hits >= 11 && hits <= 15)
    method.hits[hits as 11 | 12 | 13 | 14 | 15] += 1;
}

function pairedPermutationPValue(differences: number[], seed: number): number {
  if (differences.length < 8) return 1;
  const observed = Math.abs(
    differences.reduce((sum, value) => sum + value, 0) / differences.length
  );
  const random = seededRandom(seed);
  let extreme = 0;
  const iterations = 3000;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const mean =
      differences.reduce(
        (sum, value) => sum + (random() < 0.5 ? value : -value),
        0
      ) / differences.length;
    if (Math.abs(mean) >= observed) extreme += 1;
  }
  return (extreme + 1) / (iterations + 1);
}

export function runLotofacilRollingBacktest(
  history: Array<LotofacilDrawLike | number[]>
): LotofacilBacktestResult | null {
  const newestFirst = validHistory(history).slice(0, 100);
  if (newestFirst.length < 20) return null;
  const chronological = [...newestFirst].reverse();
  const strategy = initializeMethod();
  const randomMethod = initializeMethod();
  const differences: number[] = [];
  const random = seededRandom(chronological.length * 113);
  let contests = 0;

  for (let target = 10; target < chronological.length; target += 1) {
    const trainingNewestFirst = chronological.slice(0, target).reverse();
    const generated = generateLotofacilStrategy(trainingNewestFirst, 450);
    if (!generated) continue;
    const targetDraw = chronological[target];
    const strategyHits = generated.games.map((game) =>
      overlap(game.numbers, targetDraw)
    );
    const randomHits = Array.from({ length: 3 }, () =>
      overlap(randomGame(random), targetDraw)
    );
    strategyHits.forEach((hits) => addHits(strategy, hits));
    randomHits.forEach((hits) => addHits(randomMethod, hits));
    differences.push(
      strategyHits.reduce((sum, hits) => sum + hits, 0) / 3 -
        randomHits.reduce((sum, hits) => sum + hits, 0) / 3
    );
    contests += 1;
  }
  if (contests === 0) return null;
  const denominator = contests * 3;
  strategy.averageHits /= denominator;
  randomMethod.averageHits /= denominator;
  const averageDifference = strategy.averageHits - randomMethod.averageHits;
  const pValue = pairedPermutationPValue(differences, contests * 7919);
  const statisticallyRelevant = averageDifference > 0 && pValue < 0.05;
  return {
    contests,
    strategy,
    random: randomMethod,
    averageDifference,
    pValue,
    statisticallyRelevant,
    conclusion: statisticallyRelevant
      ? 'Nesta amostra, a estratégia teve média superior ao aleatório com diferença estatisticamente relevante. Isso não garante resultados futuros.'
      : 'Nesta amostra, não há evidência estatística suficiente de vantagem sobre jogos aleatórios. A estratégia organiza critérios; não aumenta a probabilidade matemática do sorteio.',
  };
}
