import { describe, it, expect } from 'vitest';
import { registerSchema } from '@/schemas/auth';

describe('Auth Schemas', () => {
  it('deve validar registro com dados corretos', () => {
    const result = registerSchema.safeParse({
      email: 'teste@teste.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    const result = registerSchema.safeParse({
      email: 'invalido',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senha curta', () => {
    const result = registerSchema.safeParse({
      email: 'teste@teste.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});
