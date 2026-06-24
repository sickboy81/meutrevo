import { z } from 'zod';

export const LOTTERY_IDS = [
  'megasena',
  'lotofacil',
  'quina',
  'lotomania',
  'duplasena',
  'diadesorte',
  'timemania',
  'maismilionaria',
  'supersete',
] as const;

export const createGameSchema = z.object({
  lottery: z.enum(LOTTERY_IDS),
  numbers: z.array(z.number().min(0).max(99)),
  strategy: z.enum(['balanced', 'aggressive', 'delayed']).optional(),
});

export const updateGameSchema = z.object({
  id: z.string().uuid(),
  numbers: z.array(z.number().min(1).max(60)).optional(),
  strategy: z.enum(['balanced', 'aggressive', 'delayed']).optional(),
});
