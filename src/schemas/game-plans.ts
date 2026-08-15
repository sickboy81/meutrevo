import { z } from 'zod';
import { LOTTERY_IDS } from './games';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';

export const createGamePlanSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    lottery: z.enum(LOTTERY_IDS),
    budget: z.number().min(0).max(1_000_000),
    contestsCount: z.number().int().min(1).max(100),
    objective: z
      .enum(['economy', 'coverage', 'balance', 'conference'])
      .default('balance'),
    strategy: z
      .enum(['balanced', 'aggressive', 'delayed', 'random'])
      .default('balanced'),
    games: z
      .array(z.array(z.number().int().min(0).max(99)))
      .min(1)
      .max(500),
  })
  .superRefine((data, context) => {
    const config = LOTTERY_CONFIGS[data.lottery];
    if (!config) return;
    data.games.forEach((game, index) => {
      if (game.length !== config.drawCount) {
        context.addIssue({
          code: 'custom',
          path: ['games', index],
          message: `O jogo deve ter ${config.drawCount} dezenas.`,
        });
      }
      if (new Set(game).size !== game.length) {
        context.addIssue({
          code: 'custom',
          path: ['games', index],
          message: 'O jogo não pode repetir dezenas.',
        });
      }
      if (
        game.some((number) => number < config.minNum || number > config.maxNum)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['games', index],
          message: `As dezenas devem estar entre ${config.minNum} e ${config.maxNum}.`,
        });
      }
    });
  });

export const updateGamePlanSchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  title: z.string().trim().min(1).max(80).optional(),
});
