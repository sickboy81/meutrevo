import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { sendResetPasswordEmail } from '../../../../lib/email';
import { internalServerError } from '../../../../lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '../../../../lib/rate-limit';
import crypto from 'crypto';

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({ email: '' }));
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: 'E-mail inválido ou obrigatório' },
        { status: 400 }
      );
    }

    const recoverEmailLimit = await consumeRateLimit(
      request,
      { maxRequests: 2, windowMs: 30 * 60_000 },
      { scope: 'recover-email-ip', identifier: normalizedEmail }
    );
    if (recoverEmailLimit.blocked) {
      return createRateLimitExceededResponse(
        recoverEmailLimit,
        'Muitas solicitações de recuperação para este e-mail. Aguarde antes de tentar novamente.'
      );
    }

    const recoverIpLimit = await consumeRateLimit(
      request,
      { maxRequests: 6, windowMs: 15 * 60_000 },
      { scope: 'recover-ip-window' }
    );
    if (recoverIpLimit.blocked) {
      return createRateLimitExceededResponse(
        recoverIpLimit,
        'Muitas solicitações de recuperação a partir deste IP. Aguarde antes de tentar novamente.'
      );
    }

    // Buscar usuário no banco
    const res = await db.execute({
      sql: 'SELECT id, email, name FROM users WHERE email = ? LIMIT 1',
      args: [normalizedEmail],
    });

    if (res.rows.length === 0) {
      // Retorna sucesso para evitar enumeração de e-mails
      return NextResponse.json({
        success: true,
        message:
          'Se o e-mail estiver cadastrado, as instruções serão enviadas.',
      });
    }

    const user = res.rows[0];
    const userId = user.id as string;
    const userName = user.name as string;

    // Gerar token de recuperação de senha (UUID) e expiração em 1 hora
    const resetToken = crypto.randomUUID();
    const resetTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString(); // 1 hora

    // Atualizar no banco de dados
    await db.execute({
      sql: 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      args: [resetToken, resetTokenExpires, userId],
    });

    // Enviar o e-mail
    try {
      await sendResetPasswordEmail(normalizedEmail, userName, resetToken);
    } catch (emailErr) {
      console.error('Failed to send reset password email:', emailErr);
      // Retorna erro amigável se falhar o envio de email
      return NextResponse.json(
        {
          error:
            'Falha ao processar o envio de e-mail. Tente novamente mais tarde.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Se o e-mail estiver cadastrado, as instruções serão enviadas.',
    });
  } catch (err: unknown) {
    return internalServerError('Recovery request error:', err);
  }
}
