import { describe, expect, it } from 'vitest';
import { calculateGamePlanCost, normalizeContestCount } from './game-plan-cost';

describe('game plan cost', () => {
  it('normalizes contest count to the supported range', () => {
    expect(normalizeContestCount(0)).toBe(1);
    expect(normalizeContestCount(150)).toBe(100);
    expect(normalizeContestCount('5')).toBe(5);
  });

  it('calculates per-contest and total costs', () => {
    expect(calculateGamePlanCost('lotofacil', 3, 4)).toEqual({
      contests: 4,
      costPerContest: 10.5,
      total: 42,
    });
  });

  it('does not create a negative cost for invalid game counts', () => {
    expect(calculateGamePlanCost('megasena', -2, 2).total).toBe(0);
  });
});
