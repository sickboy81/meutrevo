import { z } from 'zod';

export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  coupon: z.string().optional(),
});

export const betSchema = z.object({
  lottery: z.enum([
    'megasena',
    'lotofacil',
    'quina',
    'lotomania',
    'duplasena',
    'diadesorte',
    'timemania',
    'maismilionaria',
    'supersete',
  ]),
  numbers: z.array(z.number().min(0).max(99)),
  amount: z.number().positive(),
});
