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
  numbers: z.union([
    z.array(z.number().min(0).max(99)),
    z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) =>
          value.split(',').every((item) => {
            const number = Number(item.trim());
            return Number.isInteger(number) && number >= 0 && number <= 99;
          }),
        'Dezenas inválidas'
      ),
  ]),
  strategy: z.enum(['balanced', 'aggressive', 'delayed']).optional(),
});

export const updateGameSchema = z.object({
  id: z.string().uuid(),
  numbers: z.array(z.number().min(1).max(60)).optional(),
  strategy: z.enum(['balanced', 'aggressive', 'delayed']).optional(),
});
