import { describe, expect, it } from 'vitest';
import {
  generateLotofacilStrategy,
  runLotofacilRollingBacktest,
} from './lotofacil-strategy';

function makeHistory(size = 40) {
  return Array.from({ length: size }, (_, drawIndex) => {
    const offset = (drawIndex * 7) % 25;
    const numbers = Array.from(
      { length: 15 },
      (_, index) => ((offset + index) % 25) + 1
    )
      .sort((left, right) => left - right)
      .map((number) => String(number).padStart(2, '0'));
    return { listaDezenas: numbers };
  });
}

describe('Lotofácil strategy', () => {
  it('creates three valid games with the required parity and overlap limits', () => {
    const result = generateLotofacilStrategy(makeHistory());
    expect(result).not.toBeNull();
    const games = result!.games;
    expect(games).toHaveLength(3);
    expect(games[0].even).toBe(8);
    expect(games[0].odd).toBe(7);
    expect(games[1].even).toBe(7);
    expect(games[1].odd).toBe(8);
    games.forEach((game) => {
      expect(game.numbers).toHaveLength(15);
      expect(game.border).toBeGreaterThanOrEqual(9);
      expect(game.border).toBeLessThanOrEqual(11);
    });
    for (let first = 0; first < games.length; first += 1) {
      for (let second = first + 1; second < games.length; second += 1) {
        const common = games[first].numbers.filter((number) =>
          games[second].numbers.includes(number)
        ).length;
        expect(common).toBeLessThanOrEqual(12);
      }
    }
  });

  it('runs a causal rolling backtest with comparable totals', () => {
    const result = runLotofacilRollingBacktest(makeHistory());
    expect(result).not.toBeNull();
    expect(result!.contests).toBeGreaterThan(0);
    expect(result!.strategy.averageHits).toBeGreaterThanOrEqual(0);
    expect(result!.random.averageHits).toBeGreaterThanOrEqual(0);
    expect(result!.pValue).toBeGreaterThanOrEqual(0);
    expect(result!.pValue).toBeLessThanOrEqual(1);
  });
});
