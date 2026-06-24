import { describe, it, expect } from 'vitest';
import { createGameSchema } from '@/schemas/games';

describe('Games Schemas', () => {
  it('deve validar criação de jogo', () => {
    const result = createGameSchema.safeParse({
      lottery: 'megasena',
      numbers: [1, 2, 3, 4, 5, 6],
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar números fora do range', () => {
    const result = createGameSchema.safeParse({
      lottery: 'megasena',
      numbers: [1, 2, 3, 4, 5, 999],
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar loteria inválida', () => {
    const result = createGameSchema.safeParse({
      lottery: 'invalida',
      numbers: [1, 2, 3],
    });
    expect(result.success).toBe(false);
  });
});
