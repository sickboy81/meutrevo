import { describe, expect, it } from 'vitest';
import {
  analyzeHistoricalWindow,
  scoreGame,
  type NumericHistoricalAnalysis,
} from '../game-intelligence';

const targetGame = [1, 12, 23, 34, 45, 56];

const numericDraws = Array.from({ length: 12 }, (_, index) => ({
  contest: index + 1,
  numbers: targetGame,
}));

function getNumericAnalysis(): NumericHistoricalAnalysis {
  const analysis = analyzeHistoricalWindow({
    lottery: 'megasena',
    draws: numericDraws,
    cutoffContest: 13,
  });

  if (analysis.kind !== 'numeric') {
    throw new Error('Expected numeric Mega-Sena analysis.');
  }

  return analysis;
}

describe('game intelligence', () => {
  it('calculates historical numeric fields before the cutoff only', () => {
    const analysis = getNumericAnalysis();

    expect(analysis.dataWindow).toEqual({
      firstContest: 1,
      lastContest: 12,
      drawsAnalyzed: 12,
    });
    expect(analysis.statistics.frequency.full[1]).toBe(12);
    expect(analysis.statistics.frequency.rolling100[1]).toBe(12);
    expect(analysis.statistics.frequency.rolling30[1]).toBe(12);
    expect(analysis.statistics.frequency.rolling10[1]).toBe(10);
    expect(analysis.statistics.delay[1]).toBe(0);
    expect(analysis.statistics.lastOccurrence[1]).toBe(12);
    expect(analysis.statistics.parity.values).toEqual({ even: 3, odd: 3 });
    expect(analysis.statistics.sum.value).toBe(171);
    expect(analysis.statistics.rows.maxLoad).toBe(1);
    expect(analysis.statistics.columns.maxLoad).toBe(1);
    expect(analysis.statistics.ranges.covered).toBe(5);
    expect(analysis.statistics.consecutive.value).toBe(0);
    expect(analysis.statistics.repetition.value).toBe(6);
  });

  it('does not let the target or later contest change a pre-target analysis', () => {
    const baseline = analyzeHistoricalWindow({
      lottery: 'megasena',
      draws: numericDraws,
      cutoffContest: 13,
    });
    const withTargetAndFuture = analyzeHistoricalWindow({
      lottery: 'megasena',
      draws: [
        ...numericDraws,
        { contest: 13, numbers: [55, 56, 57, 58, 59, 60] },
        { contest: 14, numbers: [50, 51, 52, 53, 54, 55] },
      ],
      cutoffContest: 13,
    });

    expect(withTargetAndFuture).toEqual(baseline);
  });

  it('places every available number in exactly one temperature bucket', () => {
    const analysis = getNumericAnalysis();
    const buckets = {
      quente: analysis.numberTemperatures.filter(
        (temperature) => temperature.classification === 'quente'
      ),
      neutra: analysis.numberTemperatures.filter(
        (temperature) => temperature.classification === 'neutra'
      ),
      fria: analysis.numberTemperatures.filter(
        (temperature) => temperature.classification === 'fria'
      ),
    };
    const classifiedNumbers = Object.values(buckets).flatMap((bucket) =>
      bucket.map((temperature) => temperature.number)
    );

    expect(classifiedNumbers).toHaveLength(60);
    expect(new Set(classifiedNumbers).size).toBe(60);
    expect(classifiedNumbers.sort((left, right) => left - right)).toEqual(
      Array.from({ length: 60 }, (_, index) => index + 1)
    );
  });

  it('gives a game matching every historical target a fully explainable score of 100', () => {
    const score = scoreGame({
      lottery: 'megasena',
      numbers: targetGame,
      analysis: getNumericAnalysis(),
    });

    expect(score.total).toBe(100);
    expect(score.criteria).toHaveLength(8);
    expect(
      score.criteria.every(
        (criterion) => criterion.points === criterion.maxPoints
      )
    ).toBe(true);
    expect(
      score.criteria.every((criterion) =>
        criterion.explanation.includes('Valor atual:')
      )
    ).toBe(true);
    expect(score.disclaimer).toBe(
      'Score de aderencia historica; nao representa previsao de premio.'
    );
  });

  it('deducts only the configured structural criterion when the other bands accept the game', () => {
    const analysis = getNumericAnalysis();
    const permissiveAnalysis: NumericHistoricalAnalysis = {
      ...analysis,
      scoreTargets: {
        ...analysis.scoreTargets,
        structuralBalance: {
          rowMaxLoad: { min: 0, max: 0 },
          columnMaxLoad: { min: 0, max: 0 },
        },
        recentFrequency: { min: -Infinity, max: Infinity },
        delay: { min: -Infinity, max: Infinity },
        sum: { min: -Infinity, max: Infinity },
        parity: { min: -Infinity, max: Infinity },
        repeatCount: { min: -Infinity, max: Infinity },
        consecutiveCount: { min: -Infinity, max: Infinity },
        distribution: {
          coveredRanges: { min: -Infinity, max: Infinity },
          maxRangeLoad: { min: -Infinity, max: Infinity },
        },
      },
    };

    const score = scoreGame({
      lottery: 'megasena',
      numbers: targetGame,
      analysis: permissiveAnalysis,
    });
    const structural = score.criteria.find(
      (criterion) => criterion.id === 'structural-balance'
    );

    expect(structural).toMatchObject({ points: 0, maxPoints: 14 });
    expect(
      score.criteria
        .filter((criterion) => criterion.id !== 'structural-balance')
        .every((criterion) => criterion.points === criterion.maxPoints)
    ).toBe(true);
    expect(score.total).toBe(86);
  });

  it('returns an adapted Loteca outcome-by-column view instead of numeric analysis', () => {
    const analysis = analyzeHistoricalWindow({
      lottery: 'loteca',
      draws: [
        { contest: 1, outcomes: ['1', '0', '2'] },
        { contest: 2, outcomes: ['0', '0', '1'] },
      ],
      cutoffContest: 3,
    });

    expect(analysis).toMatchObject({
      kind: 'loteca',
      supported: false,
      adapted: true,
      dataWindow: { firstContest: 1, lastContest: 2, drawsAnalyzed: 2 },
      columns: [
        { column: 1, homeWins: 1, draws: 1, awayWins: 0 },
        { column: 2, homeWins: 0, draws: 2, awayWins: 0 },
        { column: 3, homeWins: 1, draws: 0, awayWins: 1 },
      ],
    });
    expect(analysis).not.toHaveProperty('numberTemperatures');
  });

  it('returns Federal ticket and series values without numeric temperatures or a score', () => {
    const analysis = analyzeHistoricalWindow({
      lottery: 'loteriafederal',
      draws: [
        { contest: 10, tickets: ['01234', '56789'], series: ['A', 'B'] },
        { contest: 11, tickets: ['10101'], series: ['C'] },
      ],
      cutoffContest: 12,
    });

    expect(analysis).toMatchObject({
      kind: 'loteriafederal',
      supported: false,
      adapted: true,
      ticketSeries: [
        { contest: 10, tickets: ['01234', '56789'], series: ['A', 'B'] },
        { contest: 11, tickets: ['10101'], series: ['C'] },
      ],
    });
    expect(analysis).not.toHaveProperty('numberTemperatures');
    expect(() =>
      scoreGame({
        lottery: 'loteriafederal',
        numbers: [1, 2, 3, 4, 5],
        analysis,
      })
    ).toThrow(/nao e disponivel/i);
  });
});
