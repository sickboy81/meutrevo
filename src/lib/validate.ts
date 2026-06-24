import { z } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { data?: T; error?: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    logger.warn('Validação falhou', { errors });
    return {
      error: NextResponse.json(
        { error: 'Dados inválidos', details: errors },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
