import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ é obrigatório').max(18),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const recoverSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const updateSchema = z.object({
  name: z.preprocess(emptyStringToUndefined, z.string().min(2).optional()),
  email: z.string().email().optional(),
  password: z.preprocess(
    emptyStringToUndefined,
    z.string().min(6).max(128).optional()
  ),
  avatar: z.string().optional(),
  favorite_lottery: z.preprocess(emptyStringToUndefined, z.string().optional()),
  cpf_cnpj: z.preprocess(
    emptyStringToUndefined,
    z.string().min(11).max(18).optional()
  ),
  city: z.preprocess(emptyStringToUndefined, z.string().max(100).optional()),
  state: z.preprocess(emptyStringToUndefined, z.string().max(2).optional()),
});
