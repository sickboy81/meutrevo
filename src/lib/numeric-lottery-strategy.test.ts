import { describe, expect, it } from 'vitest';
import { LOTTERY_CONFIGS } from './lottery-math';
import {
  generateNumericStrategy,
  runNumericRollingBacktest,
} from './numeric-lottery-strategy';

function history(configId: string, size = 36) {
  const config = LOTTERY_CONFIGS[configId];
  return Array.from({ length: size }, (_, drawIndex) => {
    const values = Array.from(
      { length: config.maxNum - config.minNum + 1 },
      (_, index) => config.minNum + index
    );
    let state = drawIndex * 7919 + 17;
    for (let index = values.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const swap = state % (index + 1);
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return {
      listaDezenas: values
        .slice(0, config.drawCount)
        .sort((left, right) => left - right)
        .map(String),
    };
  });
}

describe('numeric lottery strategy', () => {
  it.each([
    'megasena',
    'quina',
    'lotomania',
    'duplasena',
    'diadesorte',
    'timemania',
    'maismilionaria',
  ])('generates three valid %s games', (lottery) => {
    const config = LOTTERY_CONFIGS[lottery];
    const result = generateNumericStrategy(history(lottery), config);
    expect(result).not.toBeNull();
    expect(result!.games).toHaveLength(3);
    result!.games.forEach((game) => {
      expect(new Set(game.numbers).size).toBe(config.drawCount);
      expect(
        game.numbers.every(
          (number) => number >= config.minNum && number <= config.maxNum
        )
      ).toBe(true);
    });
  });

  it('runs the rolling comparison with no future result input', () => {
    const config = LOTTERY_CONFIGS.megasena;
    const result = runNumericRollingBacktest(history('megasena'), config);
    expect(result).not.toBeNull();
    expect(result!.contests).toBeGreaterThan(0);
    expect(result!.pValue).toBeGreaterThanOrEqual(0);
    expect(result!.pValue).toBeLessThanOrEqual(1);
  });
});
