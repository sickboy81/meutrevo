import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import { hashPassword, signToken } from '../../../../lib/auth-utils';
import { internalServerError } from '../../../../lib/api-auth';
import { isValidCpfCnpj, normalizeCpfCnpj } from '../../../../lib/br-documents';
import { sanitize } from '../../../../lib/sanitize';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '../../../../lib/rate-limit';
import { validateBody } from '../../../../lib/validate';
import { registerSchema } from '../../../../schemas/auth';

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateBody(registerSchema, body);
    if (validation.error) return validation.error;

    const { email, name, password, cpf_cnpj, city, state } = validation.data!;
    const normalizedEmail = normalizeEmail(email);
    const cleanName = name ? sanitize(name.trim()) : '';
    const normalizedCpfCnpj = normalizeCpfCnpj(cpf_cnpj);

    if (!normalizedEmail || !cleanName || !normalizedCpfCnpj) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes' },
        { status: 400 }
      );
    }

    const emailLimit = await consumeRateLimit(
      request,
      { maxRequests: 3, windowMs: 30 * 60_000 },
      { scope: 'register-email-ip', identifier: normalizedEmail }
    );
    if (emailLimit.blocked) {
      return createRateLimitExceededResponse(
        emailLimit,
        'Muitas tentativas de cadastro para este e-mail. Aguarde antes de tentar novamente.'
      );
    }

    const registerBurstLimit = await consumeRateLimit(
      request,
      { maxRequests: 8, windowMs: 30 * 60_000 },
      { scope: 'register-ip-window' }
    );
    if (registerBurstLimit.blocked) {
      return createRateLimitExceededResponse(
        registerBurstLimit,
        'Muitas tentativas de cadastro a partir deste IP. Aguarde antes de tentar novamente.'
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: 'A senha deve conter no máximo 128 caracteres' },
        { status: 400 }
      );
    }

    if (normalizedCpfCnpj && !isValidCpfCnpj(normalizedCpfCnpj)) {
      return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 });
    }

    // Verificar se o usuário já existe
    const checkUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    });

    if (checkUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);

    const cleanCity = city ? sanitize(String(city).trim()) : '';
    const cleanState = state ? String(state).trim().toUpperCase() : '';

    await db.execute({
      sql: 'INSERT INTO users (id, email, name, password, cpf_cnpj, city, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        userId,
        normalizedEmail,
        cleanName,
        hashedPassword,
        normalizedCpfCnpj,
        cleanCity,
        cleanState,
      ],
    });

    // Gerar Token
    const userPayload = {
      id: userId,
      email: normalizedEmail,
      name: cleanName,
      role: 'free',
    };
    const token = signToken(userPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        name: cleanName,
        role: 'free',
        cpf_cnpj: normalizedCpfCnpj,
        city: cleanCity,
        state: cleanState,
      },
    });

    // Definir cookie seguro
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    return internalServerError('Register error:', err);
  }
}
