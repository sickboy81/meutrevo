import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import type {
  GameScore,
  NumberTemperature,
  ScoreBreakdown,
} from '@/schemas/game-intelligence';

const SCORE_DISCLAIMER =
  'Score de aderencia historica; nao representa previsao de premio.' as const;

const ANALYSIS_DISCLAIMER =
  'Analise historica descritiva; nao representa previsao de premio.' as const;

const SCORE_WEIGHTS = {
  structuralBalance: 14,
  recentFrequency: 12,
  delay: 12,
  sum: 14,
  parity: 12,
  repeatCount: 12,
  consecutiveCount: 12,
  distribution: 12,
} as const;

type NumericLotteryId = Exclude<
  keyof typeof LOTTERY_CONFIGS,
  'loteca' | 'loteriafederal'
>;

export interface HistoricalDraw {
  contest: number;
  numbers?: readonly (number | string)[];
  outcomes?: readonly string[];
  tickets?: readonly string[];
  series?: readonly string[];
}

export interface TemperaturePercentiles {
  hot: number;
  cold: number;
}

export interface HistoricalAnalysisRequest {
  lottery: keyof typeof LOTTERY_CONFIGS;
  draws: readonly HistoricalDraw[];
  cutoffContest: number;
  temperaturePercentiles?: Partial<TemperaturePercentiles>;
}

export interface HistoricalWindow {
  firstContest: number;
  lastContest: number;
  drawsAnalyzed: number;
}

export interface HistoricalRange {
  min: number;
  max: number;
}

interface DrawMetrics {
  even: number;
  sum: number;
  maxRowLoad: number;
  maxColumnLoad: number;
  coveredRanges: number;
  maxRangeLoad: number;
  consecutive: number;
}

export interface NumericHistoricalAnalysis {
  kind: 'numeric';
  supported: true;
  adapted: false;
  lottery: NumericLotteryId;
  cutoffContest: number;
  dataWindow: HistoricalWindow | null;
  numberTemperatures: NumberTemperature[];
  statistics: {
    frequency: {
      full: Record<number, number>;
      rolling100: Record<number, number>;
      rolling30: Record<number, number>;
      rolling10: Record<number, number>;
    };
    delay: Record<number, number>;
    recency: {
      lastOccurrence: Record<number, number | null>;
      drawsSinceOccurrence: Record<number, number>;
    };
    lastOccurrence: Record<number, number | null>;
    parity: { values: { even: number; odd: number }; target: HistoricalRange };
    sum: { value: number; target: HistoricalRange };
    rows: { maxLoad: number; target: HistoricalRange };
    columns: { maxLoad: number; target: HistoricalRange };
    ranges: {
      covered: number;
      maxLoad: number;
      coveredTarget: HistoricalRange;
      maxLoadTarget: HistoricalRange;
    };
    consecutive: { value: number; target: HistoricalRange };
    repetition: { value: number; target: HistoricalRange; available: boolean };
  };
  scoreTargets: {
    structuralBalance: {
      rowMaxLoad: HistoricalRange;
      columnMaxLoad: HistoricalRange;
    };
    recentFrequency: HistoricalRange;
    delay: HistoricalRange;
    sum: HistoricalRange;
    parity: HistoricalRange;
    repeatCount: HistoricalRange;
    consecutiveCount: HistoricalRange;
    distribution: {
      coveredRanges: HistoricalRange;
      maxRangeLoad: HistoricalRange;
    };
  };
  disclaimer: typeof ANALYSIS_DISCLAIMER;
}

export interface LotecaHistoricalAnalysis {
  kind: 'loteca';
  supported: false;
  adapted: true;
  lottery: 'loteca';
  cutoffContest: number;
  dataWindow: HistoricalWindow | null;
  reason: string;
  columns: Array<{
    column: number;
    homeWins: number;
    draws: number;
    awayWins: number;
  }>;
  disclaimer: typeof ANALYSIS_DISCLAIMER;
}

export interface FederalHistoricalAnalysis {
  kind: 'loteriafederal';
  supported: false;
  adapted: true;
  lottery: 'loteriafederal';
  cutoffContest: number;
  dataWindow: HistoricalWindow | null;
  reason: string;
  ticketSeries: Array<{
    contest: number;
    tickets: string[];
    series?: string[];
  }>;
  disclaimer: typeof ANALYSIS_DISCLAIMER;
}

export type HistoricalAnalysis =
  | NumericHistoricalAnalysis
  | LotecaHistoricalAnalysis
  | FederalHistoricalAnalysis;

export interface ScoreGameRequest {
  lottery: keyof typeof LOTTERY_CONFIGS;
  numbers: readonly number[];
  analysis: HistoricalAnalysis;
}

function getEligibleDraws(
  draws: readonly HistoricalDraw[],
  cutoffContest: number
): HistoricalDraw[] {
  return draws
    .filter(
      (draw) =>
        Number.isInteger(draw.contest) &&
        draw.contest > 0 &&
        draw.contest < cutoffContest
    )
    .sort((left, right) => left.contest - right.contest);
}

function getWindow(draws: readonly HistoricalDraw[]): HistoricalWindow | null {
  if (draws.length === 0) return null;

  return {
    firstContest: draws[0].contest,
    lastContest: draws.at(-1)!.contest,
    drawsAnalyzed: draws.length,
  };
}

function parseNumbers(
  values: readonly (number | string)[] | undefined,
  min: number,
  max: number
): number[] {
  if (!values) return [];

  const numbers = values
    .map((value) =>
      typeof value === 'number'
        ? value
        : /^\d+$/.test(value.trim())
          ? Number(value)
          : Number.NaN
    )
    .filter(
      (value): value is number =>
        Number.isInteger(value) && value >= min && value <= max
    );

  return [...new Set(numbers)].sort((left, right) => left - right);
}

function countFrequency(
  draws: readonly number[][],
  numbers: readonly number[]
): Record<number, number> {
  const frequency = Object.fromEntries(
    numbers.map((number) => [number, 0])
  ) as Record<number, number>;

  draws.forEach((draw) => {
    draw.forEach((number) => {
      frequency[number] += 1;
    });
  });

  return frequency;
}

function percentile(values: readonly number[], point: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * point;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

function targetRange(values: readonly number[]): HistoricalRange {
  return {
    min: percentile(values, 0.3),
    max: percentile(values, 0.7),
  };
}

function inRange(value: number, range: HistoricalRange): boolean {
  return value >= range.min && value <= range.max;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rangeBucket(
  number: number,
  min: number,
  max: number,
  bucketCount: number
): number {
  const total = max - min + 1;
  return Math.min(
    bucketCount - 1,
    Math.floor(((number - min) / total) * bucketCount)
  );
}

function getDrawMetrics(
  numbers: readonly number[],
  min: number,
  max: number,
  bucketCount: number
): DrawMetrics {
  const rows = new Map<number, number>();
  const columns = new Map<number, number>();
  const ranges = new Map<number, number>();
  let even = 0;
  let sum = 0;
  let consecutive = 0;

  numbers.forEach((number, index) => {
    sum += number;
    if (number % 2 === 0) even += 1;

    const offset = number - min;
    const row = Math.floor(offset / 10);
    const column = offset % 10;
    rows.set(row, (rows.get(row) ?? 0) + 1);
    columns.set(column, (columns.get(column) ?? 0) + 1);

    const bucket = rangeBucket(number, min, max, bucketCount);
    ranges.set(bucket, (ranges.get(bucket) ?? 0) + 1);

    if (index > 0 && number === numbers[index - 1] + 1) consecutive += 1;
  });

  return {
    even,
    sum,
    maxRowLoad: Math.max(...rows.values(), 0),
    maxColumnLoad: Math.max(...columns.values(), 0),
    coveredRanges: ranges.size,
    maxRangeLoad: Math.max(...ranges.values(), 0),
    consecutive,
  };
}

function createNumberTemperatures(
  numbers: readonly number[],
  fullFrequency: Record<number, number>,
  recentFrequency: Record<number, number>,
  delay: Record<number, number>,
  lastOccurrence: Record<number, number | null>,
  percentiles: TemperaturePercentiles
): NumberTemperature[] {
  const hotThreshold = percentile(
    Object.values(fullFrequency),
    percentiles.hot
  );
  const coldThreshold = percentile(
    Object.values(fullFrequency),
    percentiles.cold
  );

  return numbers.map((number) => ({
    number,
    classification:
      fullFrequency[number] >= hotThreshold
        ? 'quente'
        : fullFrequency[number] <= coldThreshold
          ? 'fria'
          : 'neutra',
    frequency: fullFrequency[number],
    recentFrequency: recentFrequency[number],
    delay: delay[number],
    lastOccurrence: lastOccurrence[number],
  }));
}

function createLotecaAnalysis(
  draws: readonly HistoricalDraw[],
  cutoffContest: number
): LotecaHistoricalAnalysis {
  const eligible = getEligibleDraws(draws, cutoffContest);
  const byColumn = new Map<
    number,
    { homeWins: number; draws: number; awayWins: number }
  >();

  eligible.forEach((draw) => {
    draw.outcomes?.forEach((outcome, index) => {
      const column = index + 1;
      const current = byColumn.get(column) ?? {
        homeWins: 0,
        draws: 0,
        awayWins: 0,
      };
      if (outcome === '1') current.homeWins += 1;
      if (outcome === '0') current.draws += 1;
      if (outcome === '2') current.awayWins += 1;
      byColumn.set(column, current);
    });
  });

  return {
    kind: 'loteca',
    supported: false,
    adapted: true,
    lottery: 'loteca',
    cutoffContest,
    dataWindow: getWindow(eligible),
    reason:
      'Loteca e analisada por resultados 1/X/2 por coluna; frequencias numericas e score nao se aplicam.',
    columns: [...byColumn.entries()].map(([column, values]) => ({
      column,
      ...values,
    })),
    disclaimer: ANALYSIS_DISCLAIMER,
  };
}

function createFederalAnalysis(
  draws: readonly HistoricalDraw[],
  cutoffContest: number
): FederalHistoricalAnalysis {
  const eligible = getEligibleDraws(draws, cutoffContest);

  return {
    kind: 'loteriafederal',
    supported: false,
    adapted: true,
    lottery: 'loteriafederal',
    cutoffContest,
    dataWindow: getWindow(eligible),
    reason:
      'Loteria Federal usa bilhetes e series; frequencias numericas e score nao se aplicam.',
    ticketSeries: eligible.map((draw) => ({
      contest: draw.contest,
      tickets: [...(draw.tickets ?? [])],
      ...(draw.series ? { series: [...draw.series] } : {}),
    })),
    disclaimer: ANALYSIS_DISCLAIMER,
  };
}

export function analyzeHistoricalWindow(
  request: HistoricalAnalysisRequest
): HistoricalAnalysis {
  const { lottery, draws, cutoffContest } = request;
  if (!Number.isInteger(cutoffContest) || cutoffContest <= 0) {
    throw new RangeError('O concurso de corte deve ser um inteiro positivo.');
  }
  if (!LOTTERY_CONFIGS[lottery]) {
    throw new RangeError(`Loteria desconhecida: ${lottery}.`);
  }
  if (lottery === 'loteca') return createLotecaAnalysis(draws, cutoffContest);
  if (lottery === 'loteriafederal') {
    return createFederalAnalysis(draws, cutoffContest);
  }

  const percentiles: TemperaturePercentiles = {
    hot: request.temperaturePercentiles?.hot ?? 0.7,
    cold: request.temperaturePercentiles?.cold ?? 0.3,
  };
  if (
    !Number.isFinite(percentiles.hot) ||
    !Number.isFinite(percentiles.cold) ||
    percentiles.hot < 0 ||
    percentiles.hot > 1 ||
    percentiles.cold < 0 ||
    percentiles.cold > 1 ||
    percentiles.cold > percentiles.hot
  ) {
    throw new RangeError(
      'Os percentis de temperatura devem estar entre 0 e 1.'
    );
  }

  const config = LOTTERY_CONFIGS[lottery];
  const eligible = getEligibleDraws(draws, cutoffContest);
  const historicalNumbers = eligible.map((draw) =>
    parseNumbers(draw.numbers, config.minNum, config.maxNum)
  );
  const availableNumbers = Array.from(
    { length: config.maxNum - config.minNum + 1 },
    (_, index) => config.minNum + index
  );
  const fullFrequency = countFrequency(historicalNumbers, availableNumbers);
  const rolling100 = countFrequency(
    historicalNumbers.slice(-100),
    availableNumbers
  );
  const rolling30 = countFrequency(
    historicalNumbers.slice(-30),
    availableNumbers
  );
  const rolling10 = countFrequency(
    historicalNumbers.slice(-10),
    availableNumbers
  );
  const lastOccurrence = Object.fromEntries(
    availableNumbers.map((number) => [number, null])
  ) as Record<number, number | null>;

  historicalNumbers.forEach((numbers, index) => {
    numbers.forEach((number) => {
      lastOccurrence[number] = eligible[index].contest;
    });
  });

  const delay = Object.fromEntries(
    availableNumbers.map((number) => {
      const lastIndex = historicalNumbers.findLastIndex((draw) =>
        draw.includes(number)
      );
      return [
        number,
        lastIndex === -1
          ? historicalNumbers.length
          : historicalNumbers.length - 1 - lastIndex,
      ];
    })
  ) as Record<number, number>;
  const bucketCount = Math.min(5, Math.max(1, config.drawCount));
  const metrics = historicalNumbers.map((numbers) =>
    getDrawMetrics(numbers, config.minNum, config.maxNum, bucketCount)
  );
  const latestMetrics =
    metrics.at(-1) ??
    getDrawMetrics([], config.minNum, config.maxNum, bucketCount);
  const repetitions = historicalNumbers.slice(1).map((numbers, index) => {
    const previous = new Set(historicalNumbers[index]);
    return numbers.filter((number) => previous.has(number)).length;
  });
  const latestRepetition = repetitions.at(-1) ?? 0;
  const observedNumbers = availableNumbers.filter(
    (number) => fullFrequency[number] > 0
  );
  const observedRecentFrequencies = observedNumbers.map(
    (number) => rolling10[number]
  );
  const observedDelays = observedNumbers.map((number) => delay[number]);
  const rowTarget = targetRange(metrics.map((metric) => metric.maxRowLoad));
  const columnTarget = targetRange(
    metrics.map((metric) => metric.maxColumnLoad)
  );
  const coveredRangesTarget = targetRange(
    metrics.map((metric) => metric.coveredRanges)
  );
  const maxRangeLoadTarget = targetRange(
    metrics.map((metric) => metric.maxRangeLoad)
  );
  const sumTarget = targetRange(metrics.map((metric) => metric.sum));
  const parityTarget = targetRange(metrics.map((metric) => metric.even));
  const consecutiveTarget = targetRange(
    metrics.map((metric) => metric.consecutive)
  );
  const repetitionTarget = targetRange(repetitions);

  return {
    kind: 'numeric',
    supported: true,
    adapted: false,
    lottery: lottery as NumericLotteryId,
    cutoffContest,
    dataWindow: getWindow(eligible),
    numberTemperatures: createNumberTemperatures(
      availableNumbers,
      fullFrequency,
      rolling10,
      delay,
      lastOccurrence,
      percentiles
    ),
    statistics: {
      frequency: {
        full: fullFrequency,
        rolling100,
        rolling30,
        rolling10,
      },
      delay,
      recency: { lastOccurrence, drawsSinceOccurrence: delay },
      lastOccurrence,
      parity: {
        values: {
          even: latestMetrics.even,
          odd: config.drawCount - latestMetrics.even,
        },
        target: parityTarget,
      },
      sum: { value: latestMetrics.sum, target: sumTarget },
      rows: { maxLoad: latestMetrics.maxRowLoad, target: rowTarget },
      columns: { maxLoad: latestMetrics.maxColumnLoad, target: columnTarget },
      ranges: {
        covered: latestMetrics.coveredRanges,
        maxLoad: latestMetrics.maxRangeLoad,
        coveredTarget: coveredRangesTarget,
        maxLoadTarget: maxRangeLoadTarget,
      },
      consecutive: {
        value: latestMetrics.consecutive,
        target: consecutiveTarget,
      },
      repetition: {
        value: latestRepetition,
        target: repetitionTarget,
        available: repetitions.length > 0,
      },
    },
    scoreTargets: {
      structuralBalance: {
        rowMaxLoad: rowTarget,
        columnMaxLoad: columnTarget,
      },
      recentFrequency: targetRange(observedRecentFrequencies),
      delay: targetRange(observedDelays),
      sum: sumTarget,
      parity: parityTarget,
      repeatCount: repetitionTarget,
      consecutiveCount: consecutiveTarget,
      distribution: {
        coveredRanges: coveredRangesTarget,
        maxRangeLoad: maxRangeLoadTarget,
      },
    },
    disclaimer: ANALYSIS_DISCLAIMER,
  };
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatRange(range: HistoricalRange): string {
  return `${formatValue(range.min)} a ${formatValue(range.max)}`;
}

function createCriterion(
  id: string,
  title: string,
  passed: boolean,
  value: string,
  target: string,
  maxPoints: number
): ScoreBreakdown {
  const points = passed ? maxPoints : 0;
  return {
    id,
    title,
    points,
    maxPoints,
    explanation: `Valor atual: ${value}. Faixa historica: ${target}. Pontos concedidos: ${points} de ${maxPoints}.`,
  };
}

function normalizedWeights(
  available: ReadonlyArray<keyof typeof SCORE_WEIGHTS>
): Record<string, number> {
  const totalWeight = available.reduce(
    (sum, key) => sum + SCORE_WEIGHTS[key],
    0
  );
  let assigned = 0;

  return Object.fromEntries(
    available.map((key, index) => {
      const points =
        index === available.length - 1
          ? 100 - assigned
          : Math.round((SCORE_WEIGHTS[key] / totalWeight) * 100);
      assigned += points;
      return [key, points];
    })
  );
}

export function scoreGame(request: ScoreGameRequest): GameScore {
  const { lottery, numbers, analysis } = request;
  if (analysis.kind !== 'numeric') {
    throw new Error('O score nao e disponivel para modalidades adaptadas.');
  }
  if (lottery !== analysis.lottery) {
    throw new RangeError(
      'A loteria do jogo deve corresponder a analise historica.'
    );
  }
  if (!analysis.dataWindow) {
    throw new RangeError('Nao ha concursos anteriores para calcular o score.');
  }

  const config = LOTTERY_CONFIGS[lottery];
  if (
    numbers.length !== config.drawCount ||
    new Set(numbers).size !== numbers.length ||
    numbers.some(
      (number) =>
        !Number.isInteger(number) ||
        number < config.minNum ||
        number > config.maxNum
    )
  ) {
    throw new RangeError('O jogo nao respeita as regras da modalidade.');
  }

  const sorted = [...numbers].sort((left, right) => left - right);
  const metrics = getDrawMetrics(
    sorted,
    config.minNum,
    config.maxNum,
    Math.min(5, Math.max(1, config.drawCount))
  );
  const averageRecentFrequency = average(
    sorted.map((number) => analysis.statistics.frequency.rolling10[number])
  );
  const averageDelay = average(
    sorted.map((number) => analysis.statistics.delay[number])
  );
  const previousDraw = new Set(
    analysis.numberTemperatures
      .filter(
        (temperature) =>
          temperature.lastOccurrence === analysis.dataWindow!.lastContest
      )
      .map((temperature) => temperature.number)
  );
  const repeatCount = sorted.filter((number) =>
    previousDraw.has(number)
  ).length;
  const available = (
    Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>
  ).filter(
    (key) => key !== 'repeatCount' || analysis.statistics.repetition.available
  );
  const weights = normalizedWeights(available);
  const criteria: ScoreBreakdown[] = [];

  criteria.push(
    createCriterion(
      'structural-balance',
      'Equilibrio estrutural',
      inRange(
        metrics.maxRowLoad,
        analysis.scoreTargets.structuralBalance.rowMaxLoad
      ) &&
        inRange(
          metrics.maxColumnLoad,
          analysis.scoreTargets.structuralBalance.columnMaxLoad
        ),
      `maior linha ${metrics.maxRowLoad}; maior coluna ${metrics.maxColumnLoad}`,
      `linhas ${formatRange(analysis.scoreTargets.structuralBalance.rowMaxLoad)}; colunas ${formatRange(analysis.scoreTargets.structuralBalance.columnMaxLoad)}`,
      weights.structuralBalance
    )
  );
  criteria.push(
    createCriterion(
      'recent-frequency',
      'Frequencia recente',
      inRange(averageRecentFrequency, analysis.scoreTargets.recentFrequency),
      formatValue(averageRecentFrequency),
      formatRange(analysis.scoreTargets.recentFrequency),
      weights.recentFrequency
    )
  );
  criteria.push(
    createCriterion(
      'delay',
      'Atraso medio',
      inRange(averageDelay, analysis.scoreTargets.delay),
      formatValue(averageDelay),
      formatRange(analysis.scoreTargets.delay),
      weights.delay
    )
  );
  criteria.push(
    createCriterion(
      'sum-band',
      'Faixa de soma',
      inRange(metrics.sum, analysis.scoreTargets.sum),
      formatValue(metrics.sum),
      formatRange(analysis.scoreTargets.sum),
      weights.sum
    )
  );
  criteria.push(
    createCriterion(
      'parity',
      'Paridade',
      inRange(metrics.even, analysis.scoreTargets.parity),
      `${metrics.even} pares e ${numbers.length - metrics.even} impares`,
      `${formatRange(analysis.scoreTargets.parity)} pares`,
      weights.parity
    )
  );
  if (analysis.statistics.repetition.available) {
    criteria.push(
      createCriterion(
        'repeat-count',
        'Repeticao do concurso anterior',
        inRange(repeatCount, analysis.scoreTargets.repeatCount),
        formatValue(repeatCount),
        formatRange(analysis.scoreTargets.repeatCount),
        weights.repeatCount
      )
    );
  }
  criteria.push(
    createCriterion(
      'consecutive-count',
      'Sequencias consecutivas',
      inRange(metrics.consecutive, analysis.scoreTargets.consecutiveCount),
      formatValue(metrics.consecutive),
      formatRange(analysis.scoreTargets.consecutiveCount),
      weights.consecutiveCount
    )
  );
  criteria.push(
    createCriterion(
      'distribution',
      'Distribuicao por faixas',
      inRange(
        metrics.coveredRanges,
        analysis.scoreTargets.distribution.coveredRanges
      ) &&
        inRange(
          metrics.maxRangeLoad,
          analysis.scoreTargets.distribution.maxRangeLoad
        ),
      `${metrics.coveredRanges} faixas; maior carga ${metrics.maxRangeLoad}`,
      `faixas ${formatRange(analysis.scoreTargets.distribution.coveredRanges)}; carga ${formatRange(analysis.scoreTargets.distribution.maxRangeLoad)}`,
      weights.distribution
    )
  );

  const total = criteria.reduce((sum, criterion) => sum + criterion.points, 0);
  return {
    total,
    label:
      total >= 85
        ? 'Excelente aderencia'
        : total >= 60
          ? 'Boa aderencia'
          : 'Aderencia parcial',
    criteria,
    disclaimer: SCORE_DISCLAIMER,
  };
}
