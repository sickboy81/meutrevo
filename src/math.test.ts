import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  analyzeGame,
  generateSmartGame,
  LOTTERY_CONFIGS,
} from './lib/lottery-math';

function useSeededRandom(seed = 123456) {
  let state = seed;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  });
}

describe('lottery math', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scores range coverage and geometric concentration as part of game balance', () => {
    const metrics = analyzeGame(
      [9, 17, 24, 35, 44, 52],
      LOTTERY_CONFIGS.megasena,
      [1, 9, 17, 25, 40, 55]
    );

    expect(metrics.rangeBucketsCount).toBeGreaterThanOrEqual(4);
    expect(metrics.maxRangeBucketLoad).toBeLessThanOrEqual(2);
    expect(metrics.maxRowLoad).toBeLessThanOrEqual(2);
    expect(metrics.maxColumnLoad).toBeLessThanOrEqual(2);
    expect(metrics.score).toBeGreaterThanOrEqual(85);
  });

  it('balanced generation keeps fixed numbers, excludes blocked numbers, and returns a broadly distributed high-score game', () => {
    useSeededRandom();

    const result = generateSmartGame(
      LOTTERY_CONFIGS.megasena,
      [3, 5, 11, 17, 23, 31, 37, 41, 43, 47, 53, 59],
      [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
      'balanced',
      [6, 12, 18, 24, 30, 36],
      [9, 35],
      [1, 2, 3, 4, 5],
      { 7: 4, 8: 9, 10: 2 },
      { avoidConsecutive: true, maxRepeats: 1 }
    );

    expect(result.numbers).toHaveLength(LOTTERY_CONFIGS.megasena.drawCount);
    expect(result.numbers).toEqual([...result.numbers].sort((a, b) => a - b));
    expect(result.numbers).toEqual(expect.arrayContaining([9, 35]));
    expect(result.numbers.some((num) => [1, 2, 3, 4, 5].includes(num))).toBe(
      false
    );
    expect(result.metrics.repeatsCount).toBeLessThanOrEqual(1);
    expect(result.metrics.rangeBucketsCount).toBeGreaterThanOrEqual(4);
    expect(result.metrics.maxRangeBucketLoad).toBeLessThanOrEqual(2);
    expect(result.metrics.score).toBeGreaterThanOrEqual(85);
  });
});
