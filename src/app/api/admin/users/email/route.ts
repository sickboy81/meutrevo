import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';
import { sendCustomEmail } from '@/lib/email';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Auth and role verification
    const { user, response } = await requireRole(['admin']);
    if (response) return response;

    // Rate limiting: max 15 email requests/min per admin
    const rl = await consumeRateLimit(
      request,
      { maxRequests: 15, windowMs: 60_000 },
      { scope: 'admin-send-email', userId: user?.id ?? null }
    );
    if (rl.blocked) {
      return createRateLimitExceededResponse(
        rl,
        'Muitos e-mails enviados em pouco tempo. Aguarde antes de tentar novamente.'
      );
    }

    const { userId, subject, message } = await request.json();
    if (!userId || !subject || !message) {
      return NextResponse.json(
        { error: 'Campos "userId", "subject" e "message" são obrigatórios' },
        { status: 400 }
      );
    }

    // Retrieve recipient details from database
    const userQuery = await db.execute({
      sql: 'SELECT name, email FROM users WHERE id = ? LIMIT 1',
      args: [userId],
    });

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário destinatário não encontrado' },
        { status: 404 }
      );
    }

    const recipient = userQuery.rows[0];

    // Send email using Resend
    const emailResult = await sendCustomEmail(
      recipient.email as string,
      subject,
      recipient.name as string,
      message
    );

    if (emailResult.error) {
      return NextResponse.json(
        {
          error: `Erro ao enviar e-mail via Resend: ${emailResult.error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'E-mail enviado com sucesso',
    });
  } catch (err: unknown) {
    return internalServerError('Admin send email error:', err);
  }
}
