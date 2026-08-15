import { describe, expect, it } from 'vitest';
import { createGamePlanSchema } from './game-plans';

describe('create game plan schema', () => {
  const base = {
    title: 'Plano',
    lottery: 'megasena' as const,
    budget: 36,
    contestsCount: 1,
    games: [[1, 2, 3, 4, 5, 6]],
  };

  it('accepts a valid game for the selected lottery', () => {
    expect(createGamePlanSchema.safeParse(base).success).toBe(true);
  });

  it('rejects duplicate or out-of-range numbers', () => {
    const result = createGamePlanSchema.safeParse({
      ...base,
      games: [[1, 1, 2, 3, 4, 61]],
    });
    expect(result.success).toBe(false);
  });

  it('rejects the wrong number of dezenas', () => {
    const result = createGamePlanSchema.safeParse({
      ...base,
      games: [[1, 2, 3]],
    });
    expect(result.success).toBe(false);
  });
});
