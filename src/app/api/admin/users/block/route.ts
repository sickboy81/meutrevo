import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Auth and role verification
    const { user, response } = await requireRole(['admin']);
    if (response) return response;

    // Rate limiting
    const rl = await consumeRateLimit(
      request,
      { maxRequests: 15, windowMs: 60_000 },
      { scope: 'admin-block-user', userId: user?.id ?? null }
    );
    if (rl.blocked) {
      return createRateLimitExceededResponse(
        rl,
        'Muitas alterações de bloqueio. Aguarde antes de tentar novamente.'
      );
    }

    const { userId, blocked } = await request.json();
    if (!userId || typeof blocked !== 'boolean') {
      return NextResponse.json(
        { error: 'Campos "userId" e "blocked" (boolean) são obrigatórios' },
        { status: 400 }
      );
    }

    // Prevent blocking oneself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Você não pode bloquear sua própria conta de administrador' },
        { status: 400 }
      );
    }

    const blockedVal = blocked ? 1 : 0;

    // Update user in DB
    await db.execute({
      sql: 'UPDATE users SET blocked = ? WHERE id = ?',
      args: [blockedVal, userId],
    });

    return NextResponse.json({
      success: true,
      message: blocked
        ? 'Conta do usuário suspensa com sucesso'
        : 'Conta do usuário desbloqueada com sucesso',
    });
  } catch (err: unknown) {
    return internalServerError('Admin user block error:', err);
  }
}
