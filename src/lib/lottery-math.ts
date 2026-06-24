// Módulo de Matemática e Estatística das Loterias do Brasil - Otimizado

export interface LotteryConfig {
  id: string;
  name: string;
  minNum: number;
  maxNum: number;
  drawCount: number;
  expectedSumMin: number;
  expectedSumMax: number;
  expectedPrimesMin: number;
  expectedPrimesMax: number;
  expectedFibMin: number;
  expectedFibMax: number;
  expectedRepeatsMin: number; // Repetição recomendada do concurso anterior
  expectedRepeatsMax: number;
  color: string;
  accentColor: string;
}

export const LOTTERY_CONFIGS: Record<string, LotteryConfig> = {
  megasena: {
    id: 'megasena',
    name: 'Mega-Sena',
    minNum: 1,
    maxNum: 60,
    drawCount: 6,
    expectedSumMin: 120,
    expectedSumMax: 240,
    expectedPrimesMin: 1,
    expectedPrimesMax: 3,
    expectedFibMin: 1,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 1,
    color: '#209869',
    accentColor: '#00e676',
  },
  lotofacil: {
    id: 'lotofacil',
    name: 'Lotofácil',
    minNum: 1,
    maxNum: 25,
    drawCount: 15,
    expectedSumMin: 170,
    expectedSumMax: 220,
    expectedPrimesMin: 4,
    expectedPrimesMax: 7,
    expectedFibMin: 3,
    expectedFibMax: 5,
    expectedRepeatsMin: 8,
    expectedRepeatsMax: 10,
    color: '#93098f',
    accentColor: '#f50057',
  },
  quina: {
    id: 'quina',
    name: 'Quina',
    minNum: 1,
    maxNum: 80,
    drawCount: 5,
    expectedSumMin: 140,
    expectedSumMax: 260,
    expectedPrimesMin: 1,
    expectedPrimesMax: 3,
    expectedFibMin: 0,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 1,
    color: '#260085',
    accentColor: '#2979ff',
  },
  lotomania: {
    id: 'lotomania',
    name: 'Lotomania',
    minNum: 0,
    maxNum: 99,
    drawCount: 50,
    expectedSumMin: 2200,
    expectedSumMax: 2750,
    expectedPrimesMin: 12,
    expectedPrimesMax: 19,
    expectedFibMin: 4,
    expectedFibMax: 7,
    expectedRepeatsMin: 2,
    expectedRepeatsMax: 6,
    color: '#f7941d',
    accentColor: '#ff9100',
  },
  duplasena: {
    id: 'duplasena',
    name: 'Dupla Sena',
    minNum: 1,
    maxNum: 50,
    drawCount: 6,
    expectedSumMin: 100,
    expectedSumMax: 200,
    expectedPrimesMin: 1,
    expectedPrimesMax: 3,
    expectedFibMin: 1,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 1,
    color: '#a61324',
    accentColor: '#ff1744',
  },
  diadesorte: {
    id: 'diadesorte',
    name: 'Dia de Sorte',
    minNum: 1,
    maxNum: 31,
    drawCount: 7,
    expectedSumMin: 80,
    expectedSumMax: 145,
    expectedPrimesMin: 2,
    expectedPrimesMax: 4,
    expectedFibMin: 1,
    expectedFibMax: 3,
    expectedRepeatsMin: 1,
    expectedRepeatsMax: 2,
    color: '#cb9e0c',
    accentColor: '#ffd600',
  },
  timemania: {
    id: 'timemania',
    name: 'Timemania',
    minNum: 1,
    maxNum: 80,
    drawCount: 10,
    expectedSumMin: 320,
    expectedSumMax: 480,
    expectedPrimesMin: 2,
    expectedPrimesMax: 5,
    expectedFibMin: 1,
    expectedFibMax: 3,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 2,
    color: '#005b31',
    accentColor: '#76ff03',
  },
  maismilionaria: {
    id: 'maismilionaria',
    name: '+Milionária',
    minNum: 1,
    maxNum: 50,
    drawCount: 6,
    expectedSumMin: 110,
    expectedSumMax: 190,
    expectedPrimesMin: 1,
    expectedPrimesMax: 3,
    expectedFibMin: 1,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 1,
    color: '#1a3b8b',
    accentColor: '#00e5ff',
  },
  supersete: {
    id: 'supersete',
    name: 'Super Sete',
    minNum: 1,
    maxNum: 70,
    drawCount: 7,
    expectedSumMin: 24,
    expectedSumMax: 56,
    expectedPrimesMin: 1,
    expectedPrimesMax: 3,
    expectedFibMin: 0,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 1,
    color: '#a4812e',
    accentColor: '#ffab00',
  },
  loteca: {
    id: 'loteca',
    name: 'Loteca',
    minNum: 0,
    maxNum: 2,
    drawCount: 14,
    expectedSumMin: 10,
    expectedSumMax: 18,
    expectedPrimesMin: 0,
    expectedPrimesMax: 2,
    expectedFibMin: 0,
    expectedFibMax: 2,
    expectedRepeatsMin: 5,
    expectedRepeatsMax: 9,
    color: '#8b0000',
    accentColor: '#ff5252',
  },
  loteriafederal: {
    id: 'loteriafederal',
    name: 'Loteria Federal',
    minNum: 0,
    maxNum: 9,
    drawCount: 5,
    expectedSumMin: 20,
    expectedSumMax: 35,
    expectedPrimesMin: 0,
    expectedPrimesMax: 2,
    expectedFibMin: 0,
    expectedFibMax: 2,
    expectedRepeatsMin: 0,
    expectedRepeatsMax: 2,
    color: '#003366',
    accentColor: '#4fc3f7',
  },
};

const PRIMES = new Set([
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97,
]);

const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);

export function isPrime(n: number): boolean {
  return PRIMES.has(n);
}

export function isFibonacci(n: number): boolean {
  return FIBONACCI.has(n);
}

// Retorna qual quadrante o número pertence (1 a 4)
export function getQuadrant(num: number, config: LotteryConfig): number {
  const range = config.maxNum - config.minNum + 1;
  const midVal = config.minNum + Math.floor(range / 2);

  // Divide o card verticalmente e horizontalmente
  // Para loterias baseadas em cartelas de 10 colunas (Mega, Quina, etc)
  const isLeft = num % 10 >= 1 && num % 10 <= 5;
  const isTop = num < midVal;

  if (isTop && isLeft) return 1;
  if (isTop && !isLeft) return 2;
  if (!isTop && isLeft) return 3;
  return 4;
}

export interface GameMetrics {
  evenCount: number;
  oddCount: number;
  primeCount: number;
  fibCount: number;
  sum: number;
  consecutivePairs: number;
  repeatsCount: number;
  quadrantsCount: number; // Quantos quadrantes diferentes contêm números
  rangeBucketsCount: number; // Quantas faixas numericas do volante foram cobertas
  maxRangeBucketLoad: number; // Maior concentracao em uma unica faixa
  maxRowLoad: number; // Maior concentracao em uma linha de 10 dezenas
  maxColumnLoad: number; // Maior concentracao em uma coluna de 10 dezenas
  score: number; // 0 to 100 points
}

export interface LotteryDrawLike {
  listaDezenas?: string[];
  dezenasSorteadasOrdemSorteio?: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function penaltyOutsideRange(
  value: number,
  min: number,
  max: number,
  maxPenalty: number,
  scale = 1
): number {
  if (value >= min && value <= max) return 0;
  const deviation = value < min ? min - value : value - max;
  return Math.min(maxPenalty, deviation * scale);
}

function getRangeBucket(
  num: number,
  config: LotteryConfig,
  bucketCount = 5
): number {
  const totalNumbers = config.maxNum - config.minNum + 1;
  const position = num - config.minNum;
  return Math.min(
    bucketCount - 1,
    Math.floor((position / totalNumbers) * bucketCount)
  );
}

function getGridLoads(numbers: number[]): {
  maxRowLoad: number;
  maxColumnLoad: number;
} {
  const rowCounts: Record<number, number> = {};
  const colCounts: Record<number, number> = {};

  for (const num of numbers) {
    const row = Math.floor((num - 1) / 10);
    const col = (num - 1) % 10;
    rowCounts[row] = (rowCounts[row] || 0) + 1;
    colCounts[col] = (colCounts[col] || 0) + 1;
  }

  return {
    maxRowLoad: Math.max(...Object.values(rowCounts), 0),
    maxColumnLoad: Math.max(...Object.values(colCounts), 0),
  };
}

// Analisa as métricas matemáticas de um jogo gerado
export function analyzeGame(
  numbers: number[],
  config: LotteryConfig,
  lastDrawNumbers: number[] = []
): GameMetrics {
  let evenCount = 0;
  let oddCount = 0;
  let primeCount = 0;
  let fibCount = 0;
  let sum = 0;
  let consecutivePairs = 0;
  let repeatsCount = 0;

  const quadrants = new Set<number>();
  const rangeBuckets: Record<number, number> = {};
  const sorted = [...numbers].sort((a, b) => a - b);
  const rangeBucketCount = Math.min(5, Math.max(1, config.drawCount));

  for (let i = 0; i < sorted.length; i++) {
    const num = sorted[i];
    sum += num;

    if (num % 2 === 0) {
      evenCount++;
    } else {
      oddCount++;
    }

    if (isPrime(num)) {
      primeCount++;
    }

    if (isFibonacci(num)) {
      fibCount++;
    }

    if (lastDrawNumbers.includes(num)) {
      repeatsCount++;
    }

    quadrants.add(getQuadrant(num, config));
    const rangeBucket = getRangeBucket(num, config, rangeBucketCount);
    rangeBuckets[rangeBucket] = (rangeBuckets[rangeBucket] || 0) + 1;

    if (i > 0 && sorted[i] === sorted[i - 1] + 1) {
      consecutivePairs++;
    }
  }

  const quadrantsCount = quadrants.size;
  const rangeBucketsCount = Object.keys(rangeBuckets).length;
  const maxRangeBucketLoad = Math.max(...Object.values(rangeBuckets), 0);
  const { maxRowLoad, maxColumnLoad } = getGridLoads(sorted);

  // Pontuação baseada em distancia gradual dos perfis historicamente mais equilibrados.
  let score = 100;

  score -= penaltyOutsideRange(
    sum,
    config.expectedSumMin,
    config.expectedSumMax,
    24,
    0.45
  );

  score -= penaltyOutsideRange(
    primeCount,
    config.expectedPrimesMin,
    config.expectedPrimesMax,
    12,
    6
  );
  score -= penaltyOutsideRange(
    fibCount,
    config.expectedFibMin,
    config.expectedFibMax,
    8,
    4
  );

  const idealEvenMin = Math.floor(config.drawCount / 2);
  const idealEvenMax = Math.ceil(config.drawCount / 2);
  score -= penaltyOutsideRange(evenCount, idealEvenMin, idealEvenMax, 14, 5);

  const maxConsecutivePairs = Math.max(1, Math.ceil(config.drawCount * 0.18));
  score -= penaltyOutsideRange(consecutivePairs, 0, maxConsecutivePairs, 16, 5);

  const expectedQuadrants =
    config.drawCount >= 5 ? 3 : Math.min(2, config.drawCount);
  if (quadrantsCount < expectedQuadrants) {
    score -= (expectedQuadrants - quadrantsCount) * 8;
  }

  const expectedRangeBuckets = Math.min(
    rangeBucketCount,
    Math.max(3, Math.ceil(config.drawCount * 0.55))
  );
  if (rangeBucketsCount < expectedRangeBuckets) {
    score -= (expectedRangeBuckets - rangeBucketsCount) * 7;
  }

  const idealBucketLoad = Math.ceil(config.drawCount / rangeBucketCount) + 1;
  score -= penaltyOutsideRange(maxRangeBucketLoad, 0, idealBucketLoad, 12, 4);

  if (lastDrawNumbers.length > 0) {
    score -= penaltyOutsideRange(
      repeatsCount,
      config.expectedRepeatsMin,
      config.expectedRepeatsMax,
      12,
      6
    );
  }

  // Distribuição geometrica para volantes em grade decimal.
  if (
    config.id === 'megasena' ||
    config.id === 'quina' ||
    config.id === 'duplasena' ||
    config.id === 'maismilionaria'
  ) {
    score -= penaltyOutsideRange(maxRowLoad, 0, 2, 14, 7);
    score -= penaltyOutsideRange(maxColumnLoad, 0, 2, 14, 7);
  }

  return {
    evenCount,
    oddCount,
    primeCount,
    fibCount,
    sum,
    consecutivePairs,
    repeatsCount,
    quadrantsCount,
    rangeBucketsCount,
    maxRangeBucketLoad,
    maxRowLoad,
    maxColumnLoad,
    score: Math.round(clamp(score, 0, 100)),
  };
}

function hasThreeNumberRun(numbers: number[]): boolean {
  for (let i = 2; i < numbers.length; i++) {
    if (
      numbers[i] === numbers[i - 1] + 1 &&
      numbers[i - 1] === numbers[i - 2] + 1
    ) {
      return true;
    }
  }
  return false;
}

function passesAdvancedFilters(
  candidate: number[],
  metrics: GameMetrics,
  advancedFilters?: {
    avoidConsecutive?: boolean;
    customSumMin?: number;
    customSumMax?: number;
    maxRepeats?: number;
  }
): boolean {
  if (!advancedFilters) return true;

  if (advancedFilters.avoidConsecutive && hasThreeNumberRun(candidate)) {
    return false;
  }
  if (
    advancedFilters.customSumMin !== undefined &&
    advancedFilters.customSumMin > 0 &&
    metrics.sum < advancedFilters.customSumMin
  ) {
    return false;
  }
  if (
    advancedFilters.customSumMax !== undefined &&
    advancedFilters.customSumMax > 0 &&
    metrics.sum > advancedFilters.customSumMax
  ) {
    return false;
  }
  if (
    advancedFilters.maxRepeats !== undefined &&
    advancedFilters.maxRepeats >= 0 &&
    metrics.repeatsCount > advancedFilters.maxRepeats
  ) {
    return false;
  }

  return true;
}

function buildWeightedPool(
  pool: number[],
  config: LotteryConfig,
  hotNumbers: number[],
  coldNumbers: number[],
  intensity: 'balanced' | 'aggressive' | 'surpresa' | 'delayed',
  lastDrawNumbers: number[],
  delays: Record<number, number>
): number[] {
  const weightedPool: number[] = [];

  for (const num of pool) {
    let weight = 10;

    if (intensity === 'balanced') {
      if (hotNumbers.includes(num)) weight += 4;
      if (coldNumbers.includes(num)) weight += 2;
      if (!hotNumbers.includes(num) && !coldNumbers.includes(num)) weight += 1;
    } else if (intensity === 'aggressive') {
      if (hotNumbers.includes(num)) weight += 14;
      if (coldNumbers.includes(num)) weight -= 5;
    } else if (intensity === 'delayed') {
      weight = 4 + Math.min(20, delays[num] || 0);
    }

    if (lastDrawNumbers.includes(num)) {
      weight += config.id === 'lotofacil' ? 5 : -3;
    }

    for (let w = 0; w < Math.max(1, Math.round(weight)); w++) {
      weightedPool.push(num);
    }
  }

  return weightedPool;
}

function drawFromWeightedPool(
  weightedPool: number[],
  numbersSet: Set<number>
): number | null {
  const available = weightedPool.filter((num) => !numbersSet.has(num));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function rankCandidateForStrategy(
  candidate: number[],
  metrics: GameMetrics,
  config: LotteryConfig,
  hotNumbers: number[],
  coldNumbers: number[],
  intensity: 'balanced' | 'aggressive' | 'surpresa' | 'delayed',
  delays: Record<number, number>
): number {
  let score = metrics.score;
  const hotCount = candidate.filter((num) => hotNumbers.includes(num)).length;
  const coldCount = candidate.filter((num) => coldNumbers.includes(num)).length;

  if (
    intensity === 'balanced' &&
    hotNumbers.length > 0 &&
    coldNumbers.length > 0
  ) {
    const hotTarget = clamp(
      Math.round(config.drawCount * 0.3),
      1,
      config.drawCount
    );
    const coldTarget = clamp(
      Math.round(config.drawCount * 0.2),
      1,
      config.drawCount
    );
    score -= Math.abs(hotCount - hotTarget) * 1.5;
    score -= Math.abs(coldCount - coldTarget);
  }

  if (intensity === 'aggressive') {
    score += hotCount * 1.2 - coldCount * 0.8;
  }

  if (intensity === 'delayed') {
    const delayScore =
      candidate.reduce(
        (total, num) => total + Math.min(12, delays[num] || 0),
        0
      ) / config.drawCount;
    score += delayScore;
  }

  return score;
}

function improveCandidate(
  candidate: number[],
  config: LotteryConfig,
  pool: number[],
  fixedNumbers: number[],
  lastDrawNumbers: number[],
  advancedFilters?: {
    avoidConsecutive?: boolean;
    customSumMin?: number;
    customSumMax?: number;
    maxRepeats?: number;
  }
): { numbers: number[]; metrics: GameMetrics } {
  const fixedSet = new Set(fixedNumbers);
  let best = [...candidate].sort((a, b) => a - b);
  let bestMetrics = analyzeGame(best, config, lastDrawNumbers);

  for (let pass = 0; pass < 2; pass++) {
    let changed = false;

    for (const current of best) {
      if (fixedSet.has(current)) continue;

      for (let attempt = 0; attempt < 14; attempt++) {
        const replacement = pool[Math.floor(Math.random() * pool.length)];
        if (best.includes(replacement) || fixedSet.has(replacement)) continue;

        const trial = best
          .map((num) => (num === current ? replacement : num))
          .sort((a, b) => a - b);
        const trialMetrics = analyzeGame(trial, config, lastDrawNumbers);
        if (!passesAdvancedFilters(trial, trialMetrics, advancedFilters))
          continue;

        if (trialMetrics.score > bestMetrics.score) {
          best = trial;
          bestMetrics = trialMetrics;
          changed = true;
          break;
        }
      }
    }

    if (!changed) break;
  }

  return { numbers: best, metrics: bestMetrics };
}

// Gera uma sugestão inteligente de números baseando-se em pesos (ex: dezenas frequentes) e filtros
export function generateSmartGame(
  config: LotteryConfig,
  hotNumbers: number[] = [],
  coldNumbers: number[] = [],
  intensity: 'balanced' | 'aggressive' | 'surpresa' | 'delayed' = 'balanced',
  lastDrawNumbers: number[] = [],
  fixedNumbers: number[] = [],
  excludedNumbers: number[] = [],
  delays: Record<number, number> = {},
  advancedFilters?: {
    avoidConsecutive?: boolean;
    customSumMin?: number;
    customSumMax?: number;
    maxRepeats?: number;
  }
): { numbers: number[]; metrics: GameMetrics } {
  let bestGame: number[] = [];
  let bestMetrics: GameMetrics | null = null;
  let bestRank = -Infinity;

  const fixedValid = Array.from(
    new Set(
      fixedNumbers
        .filter((n) => n >= config.minNum && n <= config.maxNum)
        .filter((n) => !excludedNumbers.includes(n))
    )
  ).slice(0, config.drawCount);

  const pool: number[] = [];
  for (let i = config.minNum; i <= config.maxNum; i++) {
    if (!excludedNumbers.includes(i) && !fixedValid.includes(i)) {
      pool.push(i);
    }
  }

  const attempts = intensity === 'balanced' ? 1200 : 650;

  for (let a = 0; a < attempts; a++) {
    const numbersSet = new Set<number>(fixedValid);

    const weightedPool = buildWeightedPool(
      pool,
      config,
      hotNumbers,
      coldNumbers,
      intensity,
      lastDrawNumbers,
      delays
    );

    // Sorteia os números do pool ponderado até atingir o limite de dezenas do jogo
    while (numbersSet.size < config.drawCount) {
      const num = drawFromWeightedPool(weightedPool, numbersSet);
      if (num === null) break;
      numbersSet.add(num);
    }

    if (numbersSet.size < config.drawCount) {
      continue;
    }

    const candidate = Array.from(numbersSet).sort((x, y) => x - y);
    const improved =
      intensity === 'balanced'
        ? improveCandidate(
            candidate,
            config,
            pool,
            fixedValid,
            lastDrawNumbers,
            advancedFilters
          )
        : {
            numbers: candidate,
            metrics: analyzeGame(candidate, config, lastDrawNumbers),
          };

    if (
      !passesAdvancedFilters(
        improved.numbers,
        improved.metrics,
        advancedFilters
      )
    ) {
      continue;
    }

    const rank = rankCandidateForStrategy(
      improved.numbers,
      improved.metrics,
      config,
      hotNumbers,
      coldNumbers,
      intensity,
      delays
    );

    if (!bestMetrics || rank > bestRank) {
      bestGame = improved.numbers;
      bestMetrics = improved.metrics;
      bestRank = rank;

      if (improved.metrics.score >= 98 && rank >= 96) {
        break;
      }
    }
  }

  // Se nenhum candidato atendeu aos filtros estritos e bestGame ficou vazio,
  // gera um jogo padrão como fallback de segurança
  if (bestGame.length === 0) {
    const fallbackSet = new Set<number>(fixedValid);
    while (fallbackSet.size < config.drawCount) {
      const r =
        config.minNum +
        Math.floor(Math.random() * (config.maxNum - config.minNum + 1));
      if (!excludedNumbers.includes(r)) {
        fallbackSet.add(r);
      }
    }
    const fallbackGame = Array.from(fallbackSet).sort((x, y) => x - y);
    return {
      numbers: fallbackGame,
      metrics: analyzeGame(fallbackGame, config, lastDrawNumbers),
    };
  }

  return {
    numbers: bestGame,
    metrics: bestMetrics!,
  };
}

// Analisa a frequência de números a partir do histórico completo dos últimos 30 concursos
export function analyzeFrequency(history: LotteryDrawLike[]): {
  hot: number[];
  cold: number[];
  frequencies: Record<number, number>;
} {
  const frequencies: Record<number, number> = {};

  history.forEach((draw) => {
    const dezenas =
      draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || [];
    dezenas.forEach((d: string) => {
      const num = parseInt(d, 10);
      if (!isNaN(num)) {
        frequencies[num] = (frequencies[num] || 0) + 1;
      }
    });
  });

  const sortedFreqs = Object.entries(frequencies)
    .map(([num, freq]) => ({ num: parseInt(num, 10), freq }))
    .sort((a, b) => b.freq - a.freq);

  // Selecionamos as 12 dezenas mais quentes e as 12 mais frias
  const hot = sortedFreqs.slice(0, 12).map((item) => item.num);
  const cold = sortedFreqs.slice(-12).map((item) => item.num);

  return {
    hot,
    cold,
    frequencies,
  };
}

// Retorna as combinações possíveis de tamanho n de um array
export function getCombinations(array: number[], size: number): number[][] {
  const result: number[][] = [];
  function helper(start: number, combo: number[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

// Gera jogos baseados em desdobramento/fechamento matemático de dezenas selecionadas
/**
 * Fechamento / Wheeling — gera jogos com garantia matemática.
 *
 * @param guaranteeType:
 *   'full'   → todas as combinações (garante Sena se os 6 sorteados estão no grupo)
 *   'quina'  → garante Quina (5 acertos) se pelo menos 5 sorteados estão no grupo
 *   'quadra' → garante Quadra (4 acertos) se pelo menos 4 sorteados estão no grupo
 */
export function generateWheelingGames(
  config: LotteryConfig,
  selectedNumbers: number[],
  guaranteeType: 'full' | 'quadra' | 'quina'
): number[][] {
  const numbers = [...selectedNumbers].sort((a, b) => a - b);
  const size = config.drawCount;
  if (numbers.length < size) return [];

  const allCombos = getCombinations(numbers, size);

  // Full wheel: retorna todas as combinações
  if (guaranteeType === 'full') return allCombos;

  // Para garantia reduzida, usamos Greedy Set Cover:
  // Queremos cobrir todos os subconjuntos de tamanho `target`
  // usando o menor número de jogos (combinações de tamanho `size`)
  const target = guaranteeType === 'quina' ? size - 1 : size - 2;

  // Gera todos os subconjuntos-alvo que precisam ser cobertos
  const targets = getCombinations(numbers, target);
  const uncovered = new Set(targets.map((t) => t.join(',')));

  const selectedGames: number[][] = [];

  // Greedy: a cada iteração, escolhe o jogo que cobre mais alvos descobertos
  while (uncovered.size > 0 && selectedGames.length < allCombos.length) {
    let bestCombo: number[] | null = null;
    let bestCoverage = 0;

    for (const combo of allCombos) {
      // Pula jogos já selecionados
      if (selectedGames.some((g) => g.join(',') === combo.join(','))) continue;

      // Conta quantos alvos descobertos este jogo cobre
      const comboSubsets = getCombinations(combo, target);
      let coverage = 0;
      for (const sub of comboSubsets) {
        if (uncovered.has(sub.join(','))) coverage++;
      }

      if (coverage > bestCoverage) {
        bestCoverage = coverage;
        bestCombo = combo;
      }
    }

    if (!bestCombo || bestCoverage === 0) break;

    selectedGames.push(bestCombo);

    // Marca os alvos cobertos como descobertos
    const coveredSubsets = getCombinations(bestCombo, target);
    for (const sub of coveredSubsets) {
      uncovered.delete(sub.join(','));
    }
  }

  return selectedGames;
}

/** Calcula quantos jogos um fechamento gera (sem gerar de fato) */
export function estimateWheelingCount(
  n: number, // números escolhidos
  k: number, // tamanho do jogo (drawCount)
  guaranteeType: 'full' | 'quadra' | 'quina'
): number {
  if (n < k) return 0;
  if (guaranteeType === 'full') return calculateCombinations(n, k);
  // Estimativa para reduzido: no mínimo precisa cobrir todos os C(n,target) subconjuntos
  // Um jogo cobre C(k, target) subconjuntos → mínimo teórico = ceil(C(n,target) / C(k,target))
  const target = guaranteeType === 'quina' ? k - 1 : k - 2;
  const totalTargets = calculateCombinations(n, target);
  const coveragePerGame = calculateCombinations(k, target);
  return Math.ceil(totalTargets / coveragePerGame);
}

// Calcula o atrasômetro: quantos concursos se passaram desde que cada número foi sorteado
export function calculateDelays(
  config: LotteryConfig,
  history: LotteryDrawLike[]
): Record<number, number> {
  const delays: Record<number, number> = {};

  // Inicializa todos com o atraso máximo (tamanho do histórico disponível)
  for (let i = config.minNum; i <= config.maxNum; i++) {
    delays[i] = history.length;
  }

  // Percorre o histórico do mais recente ao mais antigo
  for (let contestIdx = 0; contestIdx < history.length; contestIdx++) {
    const draw = history[contestIdx];
    const dezenas =
      draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || [];
    dezenas.forEach((d: string) => {
      const num = parseInt(d, 10);
      if (!isNaN(num) && delays[num] === history.length) {
        delays[num] = contestIdx; // index 0 significa sorteado no último
      }
    });
  }

  return delays;
}

// Analisa quais dezenas costumam sair mais frequentemente acompanhadas de uma dezena específica
export function analyzeCoOccurrences(
  targetNum: number,
  history: LotteryDrawLike[]
): { num: number; freq: number }[] {
  const counts: Record<number, number> = {};

  history.forEach((draw) => {
    const dezenas = (
      draw.listaDezenas ||
      draw.dezenasSorteadasOrdemSorteio ||
      []
    ).map((d: string) => parseInt(d, 10));
    if (dezenas.includes(targetNum)) {
      dezenas.forEach((num: number) => {
        if (num !== targetNum && !isNaN(num)) {
          counts[num] = (counts[num] || 0) + 1;
        }
      });
    }
  });

  return Object.entries(counts)
    .map(([num, freq]) => ({ num: parseInt(num, 10), freq }))
    .sort((a, b) => b.freq - a.freq);
}

// Calcula coeficientes binomiais C(n, k)
export function calculateCombinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= n - i + 1;
    den *= i;
  }
  return num / den;
}

// Calcula as probabilidades exatas para as faixas principal (sena), quina e quadra
export function calculateLotteryOdds(
  config: LotteryConfig,
  selectedCount: number
): { sena: number; quina: number; quadra: number } | null {
  const totalNumbers = config.maxNum - config.minNum + 1;
  const drawCount = config.drawCount;

  if (selectedCount < drawCount) return null;

  const totalOutcomes = calculateCombinations(totalNumbers, drawCount);

  const senaOutcomes = calculateCombinations(selectedCount, drawCount);
  const senaOdds =
    senaOutcomes > 0 ? Math.round(totalOutcomes / senaOutcomes) : 0;

  const quinaOutcomes =
    calculateCombinations(selectedCount, drawCount - 1) *
    calculateCombinations(totalNumbers - selectedCount, 1);
  const quinaOdds =
    quinaOutcomes > 0 ? Math.round(totalOutcomes / quinaOutcomes) : 0;

  const quadraOutcomes =
    calculateCombinations(selectedCount, drawCount - 2) *
    calculateCombinations(totalNumbers - selectedCount, 2);
  const quadraOdds =
    quadraOutcomes > 0 ? Math.round(totalOutcomes / quadraOutcomes) : 0;

  return {
    sena: senaOdds,
    quina: quinaOdds,
    quadra: quadraOdds,
  };
}

// Calcula o Ciclo das Dezenas
export function calculateLotteryCycle(
  config: LotteryConfig,
  history: LotteryDrawLike[]
): { missing: number[]; drawnCount: number; total: number; progress: number } {
  const totalNumbers = config.maxNum - config.minNum + 1;
  const drawn = new Set<number>();

  // Varre o histórico do mais recente para o mais antigo
  for (const draw of history) {
    const dezenas = (
      draw.listaDezenas ||
      draw.dezenasSorteadasOrdemSorteio ||
      []
    ).map((d: string) => parseInt(d, 10));

    // Antes de adicionar as dezenas deste sorteio, verificamos se adicionar elas completaria o ciclo.
    // Se sim, o ciclo atual começou neste concurso.
    const tempSet = new Set(drawn);
    dezenas.forEach((d: number) => {
      if (!isNaN(d) && d >= config.minNum && d <= config.maxNum) {
        tempSet.add(d);
      }
    });

    if (tempSet.size === totalNumbers && drawn.size < totalNumbers) {
      break;
    }

    dezenas.forEach((d: number) => {
      if (!isNaN(d) && d >= config.minNum && d <= config.maxNum) {
        drawn.add(d);
      }
    });
  }

  const missing: number[] = [];
  for (let i = config.minNum; i <= config.maxNum; i++) {
    if (!drawn.has(i)) {
      missing.push(i);
    }
  }

  const progress = Math.round((drawn.size / totalNumbers) * 100);

  return {
    missing: missing.sort((a, b) => a - b),
    drawnCount: drawn.size,
    total: totalNumbers,
    progress,
  };
}

// Roda backtest de estratégias
export function runBacktest(
  config: LotteryConfig,
  history: LotteryDrawLike[],
  hot: number[],
  cold: number[],
  delays: Record<number, number>
): Record<string, { totalHits: number; prizeCount: number; maxHits: number }> {
  const strategies: ('balanced' | 'aggressive' | 'delayed')[] = [
    'balanced',
    'aggressive',
    'delayed',
  ];
  const results: Record<
    string,
    { totalHits: number; prizeCount: number; maxHits: number }
  > = {
    balanced: { totalHits: 0, prizeCount: 0, maxHits: 0 },
    aggressive: { totalHits: 0, prizeCount: 0, maxHits: 0 },
    delayed: { totalHits: 0, prizeCount: 0, maxHits: 0 },
  };

  const testSubset = history.slice(0, Math.min(20, history.length));
  if (testSubset.length === 0) return results;

  for (const strat of strategies) {
    let totalHits = 0;
    let prizeCount = 0;
    let maxHits = 0;

    const simulatedGames: number[][] = [];
    for (let g = 0; g < 10; g++) {
      const gameObj = generateSmartGame(
        config,
        hot,
        cold,
        strat === 'aggressive' ? 'aggressive' : strat,
        [],
        [],
        [],
        delays
      );
      simulatedGames.push(gameObj.numbers);
    }

    for (const draw of testSubset) {
      const dezenas = (
        draw.listaDezenas ||
        draw.dezenasSorteadasOrdemSorteio ||
        []
      ).map((d: string) => parseInt(d, 10));

      for (const game of simulatedGames) {
        const hits = game.filter((n) => dezenas.includes(n)).length;
        totalHits += hits;
        if (hits > maxHits) maxHits = hits;

        if (config.id === 'lotofacil') {
          if (hits >= 11) prizeCount++;
        } else {
          if (hits >= 4) prizeCount++;
        }
      }
    }

    results[strat] = {
      totalHits,
      prizeCount,
      maxHits,
    };
  }

  return results;
}

// Gera um conjunto de jogos otimizado para Bolão, dispersando os números para cobrir o maior espaço amostral
export function generateBolaoOtimizado(
  config: LotteryConfig,
  size: number,
  selectedNumbers: number[] = [],
  hotNumbers: number[] = [],
  coldNumbers: number[] = [],
  lastDrawNumbers: number[] = [],
  delays: Record<number, number> = {}
): { numbers: number[]; metrics: GameMetrics }[] {
  const games: { numbers: number[]; metrics: GameMetrics }[] = [];
  const numbersPool =
    selectedNumbers.length >= config.drawCount
      ? [...selectedNumbers]
      : Array.from(
          { length: config.maxNum - config.minNum + 1 },
          (_, i) => config.minNum + i
        );

  // Rastreamento de uso para garantir a dispersão (cobertura homogênea)
  const usageCount: Record<number, number> = {};
  numbersPool.forEach((num) => {
    usageCount[num] = 0;
  });

  for (let g = 0; g < size; g++) {
    let bestCandidate: number[] = [];
    let bestCandidateMetrics: GameMetrics | null = null;
    let minOverlap = Infinity;

    // Tentamos gerar 50 candidatos para escolher o que tiver menor interseção com os jogos já gerados
    // e com boa pontuação matemática
    for (let c = 0; c < 50; c++) {
      // Ordena o pool baseado no menor uso para priorizar dezenas menos frequentes no bolão
      const poolSortedByUsage = [...numbersPool].sort((a, b) => {
        // adiciona uma pitada de aleatoriedade no desempate
        const usageDiff = usageCount[a] - usageCount[b];
        if (usageDiff === 0) return Math.random() - 0.5;
        return usageDiff;
      });

      // Pega as dezenas menos usadas + insere algumas dezenas aleatórias/quentes para balancear
      const candidateSet = new Set<number>();

      // Garante pelo menos metade das dezenas do cartão a partir das menos usadas
      const halfSize = Math.floor(config.drawCount / 2);
      for (let i = 0; i < halfSize; i++) {
        if (i < poolSortedByUsage.length) {
          candidateSet.add(poolSortedByUsage[i]);
        }
      }

      // Preenche o restante sorteando do pool ponderado
      while (candidateSet.size < config.drawCount) {
        const randNum =
          poolSortedByUsage[
            Math.floor(Math.random() * poolSortedByUsage.length)
          ];
        candidateSet.add(randNum);
      }

      const candidate = Array.from(candidateSet).sort((x, y) => x - y);
      const metrics = analyzeGame(candidate, config, lastDrawNumbers);

      // Calcula a interseção (sobreposição) com jogos já gerados
      let overlap = 0;
      for (const existingGame of games) {
        const intersection = candidate.filter((n) =>
          existingGame.numbers.includes(n)
        ).length;
        overlap += intersection;
      }

      // Queremos jogos com pontuação decente (score >= 70) e sobreposição mínima
      if (metrics.score >= 70 && overlap < minOverlap) {
        minOverlap = overlap;
        bestCandidate = candidate;
        bestCandidateMetrics = metrics;
      }
    }

    // Fallback caso não ache candidato válido no loop anterior
    if (bestCandidate.length === 0) {
      const fallbackObj = generateSmartGame(
        config,
        hotNumbers,
        coldNumbers,
        'balanced',
        lastDrawNumbers,
        [],
        [],
        delays
      );
      bestCandidate = fallbackObj.numbers;
      bestCandidateMetrics = fallbackObj.metrics;
    }

    // Registra o uso das dezenas no contador
    bestCandidate.forEach((num) => {
      if (usageCount[num] !== undefined) {
        usageCount[num]++;
      }
    });

    games.push({
      numbers: bestCandidate,
      metrics: bestCandidateMetrics!,
    });
  }

  return games;
}
