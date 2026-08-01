import type { LotteryConfig } from './lottery-math';

export const NUMERIC_STRATEGY_LOTTERIES = [
  'megasena',
  'quina',
  'lotomania',
  'duplasena',
  'diadesorte',
  'timemania',
  'maismilionaria',
] as const;

export type NumericDraw = {
  listaDezenas?: string[];
  dezenasSorteadasOrdemSorteio?: string[];
};

type FrequencyMap = Record<number, number>;

export type NumericStrategyAnalysis = {
  drawCount: number;
  numberCount: number;
  frequencies: {
    full: FrequencyMap;
    last100: FrequencyMap;
    last30: FrequencyMap;
    last10: FrequencyMap;
  };
  delays: FrequencyMap;
  sumRange: { min: number; max: number; median: number };
  repeatRange: { min: number; max: number };
  evenRange: { min: number; max: number; median: number };
  rowRange: { min: number; max: number };
  columnRange: { min: number; max: number };
  sequenceRange: { min: number; max: number };
  topPairs: { numbers: number[]; count: number }[];
  topTriads: { numbers: number[]; count: number }[];
};

export type NumericStrategyGame = {
  label: 'Jogo 1' | 'Jogo 2' | 'Jogo 3';
  numbers: number[];
  even: number;
  odd: number;
  sum: number;
  repeats: number;
  maxSequence: number;
  rows: number;
  columns: number;
};

export type NumericStrategyResult = {
  lotteryName: string;
  analysis: NumericStrategyAnalysis;
  games: NumericStrategyGame[];
};

export type NumericBacktestResult = {
  contests: number;
  strategyAverage: number;
  randomAverage: number;
  strategyMax: number;
  randomMax: number;
  strategyBands: Record<string, number>;
  randomBands: Record<string, number>;
  difference: number;
  pValue: number;
  statisticallyRelevant: boolean;
  conclusion: string;
};

const bandFor = (drawCount: number) =>
  Array.from({ length: Math.min(3, drawCount + 1) }, (_, index) =>
    Math.max(0, drawCount - index - 1)
  );

function extractNumbers(
  draw: NumericDraw | number[],
  config: LotteryConfig
): number[] {
  const raw = Array.isArray(draw)
    ? draw
    : (draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || []).map(
        Number
      );
  return Array.from(
    new Set(
      raw.filter(
        (number) =>
          Number.isInteger(number) &&
          number >= config.minNum &&
          number <= config.maxNum
      )
    )
  ).sort((a, b) => a - b);
}

function validHistory(
  history: Array<NumericDraw | number[]>,
  config: LotteryConfig
): number[][] {
  return history
    .map((draw) => extractNumbers(draw, config))
    .filter((draw) => draw.length === config.drawCount);
}

function frequency(draws: number[][], config: LotteryConfig): FrequencyMap {
  const result: FrequencyMap = {};
  for (let number = config.minNum; number <= config.maxNum; number += 1)
    result[number] = 0;
  draws.forEach((draw) => draw.forEach((number) => (result[number] += 1)));
  return result;
}

function quantile(values: number[], percentile: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return Math.round(
    sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
  );
}

function overlap(first: number[], second: number[]): number {
  const lookup = new Set(first);
  return second.filter((number) => lookup.has(number)).length;
}

function sequenceLength(numbers: number[]): number {
  let current = 0;
  let max = 0;
  let previous = Number.NaN;
  numbers.forEach((number) => {
    current = number === previous + 1 ? current + 1 : 1;
    previous = number;
    max = Math.max(max, current);
  });
  return max;
}

function loads(
  numbers: number[],
  config: LotteryConfig
): { rows: number[]; columns: number[] } {
  const columnsCount = 10;
  const rowsCount = Math.ceil(
    (config.maxNum - config.minNum + 1) / columnsCount
  );
  const rows = Array.from({ length: rowsCount }, () => 0);
  const columns = Array.from({ length: columnsCount }, () => 0);
  numbers.forEach((number) => {
    const position = number - config.minNum;
    rows[Math.floor(position / columnsCount)] += 1;
    columns[position % columnsCount] += 1;
  });
  return { rows, columns };
}

function cooccurrences(draws: number[][]) {
  const pairs: Record<string, number> = {};
  const triads: Record<string, number> = {};
  draws.forEach((draw) => {
    for (let first = 0; first < draw.length; first += 1) {
      for (let second = first + 1; second < draw.length; second += 1) {
        const pair = `${draw[first]}-${draw[second]}`;
        pairs[pair] = (pairs[pair] || 0) + 1;
        for (let third = second + 1; third < draw.length; third += 1) {
          const triad = `${draw[first]}-${draw[second]}-${draw[third]}`;
          triads[triad] = (triads[triad] || 0) + 1;
        }
      }
    }
  });
  return { pairs, triads };
}

export function analyzeNumericHistory(
  history: Array<NumericDraw | number[]>,
  config: LotteryConfig
): NumericStrategyAnalysis {
  const draws = validHistory(history, config);
  const sums = draws.map((draw) =>
    draw.reduce((total, number) => total + number, 0)
  );
  const evens = draws.map(
    (draw) => draw.filter((number) => number % 2 === 0).length
  );
  const sequences = draws.map(sequenceLength);
  const rowLoads = draws.flatMap((draw) => loads(draw, config).rows);
  const columnLoads = draws.flatMap((draw) => loads(draw, config).columns);
  const delays: FrequencyMap = {};
  for (let number = config.minNum; number <= config.maxNum; number += 1)
    delays[number] = draws.length;
  draws.forEach((draw, index) =>
    draw.forEach((number) => {
      if (delays[number] === draws.length) delays[number] = index;
    })
  );
  const repeats = draws
    .slice(0, -1)
    .map((draw, index) => overlap(draw, draws[index + 1]));
  const { pairs, triads } = cooccurrences(draws);
  const top = (source: Record<string, number>) =>
    Object.entries(source)
      .map(([key, count]) => ({ numbers: key.split('-').map(Number), count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 12);
  const last100 = draws.slice(0, 100);
  return {
    drawCount: draws.length,
    numberCount: config.maxNum - config.minNum + 1,
    frequencies: {
      full: frequency(draws, config),
      last100: frequency(last100, config),
      last30: frequency(draws.slice(0, 30), config),
      last10: frequency(draws.slice(0, 10), config),
    },
    delays,
    sumRange: {
      min: quantile(sums, 0.2),
      max: quantile(sums, 0.8),
      median: quantile(sums, 0.5),
    },
    repeatRange: { min: quantile(repeats, 0.2), max: quantile(repeats, 0.8) },
    evenRange: {
      min: quantile(evens, 0.2),
      max: quantile(evens, 0.8),
      median: quantile(evens, 0.5),
    },
    rowRange: { min: quantile(rowLoads, 0.1), max: quantile(rowLoads, 0.9) },
    columnRange: {
      min: quantile(columnLoads, 0.1),
      max: quantile(columnLoads, 0.9),
    },
    sequenceRange: {
      min: quantile(sequences, 0.15),
      max: quantile(sequences, 0.85),
    },
    topPairs: top(pairs),
    topTriads: top(triads),
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

function weightedPick(
  available: number[],
  weights: FrequencyMap,
  random: () => number
): number {
  const total = available.reduce((sum, number) => sum + weights[number], 0);
  let cursor = random() * total;
  for (const number of available) {
    cursor -= weights[number];
    if (cursor <= 0) return number;
  }
  return available[available.length - 1];
}

function randomGame(config: LotteryConfig, random: () => number): number[] {
  const values = Array.from(
    { length: config.maxNum - config.minNum + 1 },
    (_, index) => config.minNum + index
  );
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [values[index], values[swap]] = [values[swap], values[index]];
  }
  return values.slice(0, config.drawCount).sort((a, b) => a - b);
}

function validCandidate(
  numbers: number[],
  analysis: NumericStrategyAnalysis,
  config: LotteryConfig,
  previous: number[],
  evenTarget: number
): boolean {
  const even = numbers.filter((number) => number % 2 === 0).length;
  const sum = numbers.reduce((total, number) => total + number, 0);
  const { rows, columns } = loads(numbers, config);
  const rowMax = Math.ceil(config.drawCount / rows.length) + 2;
  const columnMax = Math.ceil(config.drawCount / 10) + 3;
  return (
    even === evenTarget &&
    sum >= analysis.sumRange.min &&
    sum <= analysis.sumRange.max &&
    overlap(numbers, previous) >= analysis.repeatRange.min &&
    overlap(numbers, previous) <= analysis.repeatRange.max &&
    Math.max(...rows) <= rowMax &&
    Math.max(...columns) <= columnMax
  );
}

function scoreCandidate(
  numbers: number[],
  analysis: NumericStrategyAnalysis
): number {
  const set = new Set(numbers);
  let score = numbers.reduce(
    (total, number) =>
      total +
      (analysis.frequencies.last30[number] || 0) +
      (analysis.frequencies.last10[number] || 0) * 1.4,
    0
  );
  analysis.topPairs.forEach((pair) => {
    if (pair.numbers.every((number) => set.has(number)))
      score += pair.count * 0.8;
  });
  analysis.topTriads.forEach((triad) => {
    if (triad.numbers.every((number) => set.has(number)))
      score += triad.count * 0.3;
  });
  score -=
    Math.abs(
      numbers.reduce((total, number) => total + number, 0) -
        analysis.sumRange.median
    ) * 0.08;
  score -= Math.abs(sequenceLength(numbers) - analysis.sequenceRange.max) * 0.4;
  return score;
}

function createGame(
  label: NumericStrategyGame['label'],
  analysis: NumericStrategyAnalysis,
  config: LotteryConfig,
  previous: number[],
  evenTarget: number,
  avoid: number[][],
  seed: number,
  attempts: number
): NumericStrategyGame | null {
  const random = seededRandom(seed);
  let best: number[] | null = null;
  let bestScore = -Infinity;
  const allNumbers = Array.from(
    { length: config.maxNum - config.minNum + 1 },
    (_, index) => config.minNum + index
  );
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate: number[] = [];
    while (candidate.length < config.drawCount) {
      const available = allNumbers.filter(
        (number) => !candidate.includes(number)
      );
      const weights: FrequencyMap = {};
      available.forEach((number) => {
        weights[number] =
          1 +
          (analysis.frequencies.full[number] || 0) * 0.12 +
          (analysis.frequencies.last30[number] || 0) * 0.65 +
          (analysis.frequencies.last10[number] || 0) * 0.9 +
          Math.min(4, (analysis.delays[number] || 0) * 0.1);
      });
      candidate.push(weightedPick(available, weights, random));
    }
    candidate.sort((a, b) => a - b);
    const overlapLimit = Math.max(
      12,
      Math.ceil((3 * config.drawCount - analysis.numberCount) / 3),
      config.drawCount >= 30 ? Math.ceil(config.drawCount * 0.55) : 0
    );
    if (
      !validCandidate(candidate, analysis, config, previous, evenTarget) ||
      avoid.some((game) => overlap(game, candidate) > overlapLimit)
    )
      continue;
    const score = scoreCandidate(candidate, analysis);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  if (!best) return null;
  const even = best.filter((number) => number % 2 === 0).length;
  const grid = loads(best, config);
  return {
    label,
    numbers: best,
    even,
    odd: best.length - even,
    sum: best.reduce((total, number) => total + number, 0),
    repeats: overlap(best, previous),
    maxSequence: sequenceLength(best),
    rows: Math.max(...grid.rows),
    columns: Math.max(...grid.columns),
  };
}

export function generateNumericStrategy(
  history: Array<NumericDraw | number[]>,
  config: LotteryConfig,
  attempts = 1800
): NumericStrategyResult | null {
  const draws = validHistory(history, config);
  if (draws.length < 10) return null;
  const analysis = analyzeNumericHistory(draws, config);
  const baseline = Math.round(analysis.evenRange.median);
  const targets = [
    baseline,
    Math.max(0, Math.min(config.drawCount, baseline - 1)),
    Math.min(config.drawCount, baseline + 1),
  ];
  const seed = draws[0].reduce(
    (total, number) => total * 31 + number,
    draws.length
  );
  const games: NumericStrategyGame[] = [];
  for (const [index, target] of targets.entries()) {
    const game = createGame(
      `Jogo ${index + 1}` as NumericStrategyGame['label'],
      analysis,
      config,
      draws[0],
      target,
      games.map((item) => item.numbers),
      seed + index * 104729,
      attempts
    );
    if (!game) return null;
    games.push(game);
  }
  return { lotteryName: config.name, analysis, games };
}

function pValue(differences: number[], seed: number): number {
  if (differences.length < 8) return 1;
  const observed = Math.abs(
    differences.reduce((sum, value) => sum + value, 0) / differences.length
  );
  const random = seededRandom(seed);
  let extreme = 0;
  for (let iteration = 0; iteration < 3000; iteration += 1) {
    const mean =
      differences.reduce(
        (sum, value) => sum + (random() < 0.5 ? value : -value),
        0
      ) / differences.length;
    if (Math.abs(mean) >= observed) extreme += 1;
  }
  return (extreme + 1) / 3001;
}

function addBandCounts(bands: Record<string, number>, hits: number): void {
  const key = String(hits);
  if (key in bands) bands[key] += 1;
}

export function runNumericRollingBacktest(
  history: Array<NumericDraw | number[]>,
  config: LotteryConfig
): NumericBacktestResult | null {
  const draws = validHistory(history, config).slice(0, 100).reverse();
  if (draws.length < 20) return null;
  const bands = bandFor(config.drawCount);
  const strategyBands = Object.fromEntries(
    bands.map((band) => [String(band), 0])
  );
  const randomBands = Object.fromEntries(
    bands.map((band) => [String(band), 0])
  );
  const random = seededRandom(draws.length * 113);
  const differences: number[] = [];
  let strategyHitsTotal = 0;
  let randomHitsTotal = 0;
  let strategyMax = 0;
  let randomMax = 0;
  let contests = 0;
  for (let target = 10; target < draws.length; target += 1) {
    const generated = generateNumericStrategy(
      draws.slice(0, target).reverse(),
      config,
      500
    );
    if (!generated) continue;
    const actual = draws[target];
    const strategyHits = generated.games.map((game) =>
      overlap(game.numbers, actual)
    );
    const randomHits = Array.from({ length: 3 }, () =>
      overlap(randomGame(config, random), actual)
    );
    strategyHits.forEach((hits) => {
      strategyHitsTotal += hits;
      strategyMax = Math.max(strategyMax, hits);
      addBandCounts(strategyBands, hits);
    });
    randomHits.forEach((hits) => {
      randomHitsTotal += hits;
      randomMax = Math.max(randomMax, hits);
      addBandCounts(randomBands, hits);
    });
    differences.push(
      strategyHits.reduce((sum, hits) => sum + hits, 0) / 3 -
        randomHits.reduce((sum, hits) => sum + hits, 0) / 3
    );
    contests += 1;
  }
  if (!contests) return null;
  const strategyAverage = strategyHitsTotal / (contests * 3);
  const randomAverage = randomHitsTotal / (contests * 3);
  const difference = strategyAverage - randomAverage;
  const significance = pValue(differences, contests * 7919);
  return {
    contests,
    strategyAverage,
    randomAverage,
    strategyMax,
    randomMax,
    strategyBands,
    randomBands,
    difference,
    pValue: significance,
    statisticallyRelevant: difference > 0 && significance < 0.05,
    conclusion:
      difference > 0 && significance < 0.05
        ? 'Nesta amostra, a estratégia teve vantagem estatisticamente relevante. Isso não garante resultados futuros.'
        : 'Nesta amostra, não há evidência suficiente de vantagem sobre o aleatório. A estratégia organiza critérios, mas não altera a probabilidade matemática do sorteio.',
  };
}
