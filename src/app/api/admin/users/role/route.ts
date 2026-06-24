import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limiting: 20 requests/min por IP para endpoints admin
    const { user, response } = await requireRole(['admin']);
    if (response) return response;

    const rl = await consumeRateLimit(
      request,
      { maxRequests: 12, windowMs: 60_000 },
      { scope: 'admin-role-user', userId: user?.id ?? null }
    );
    if (rl.blocked) {
      return createRateLimitExceededResponse(
        rl,
        'Muitas mudanças de função em pouco tempo. Aguarde antes de tentar novamente.'
      );
    }

    const { userId, newRole } = await request.json();
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Campos "userId" e "newRole" são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['free', 'pro', 'admin'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Função inválida. Escolha entre "free", "pro" ou "admin"' },
        { status: 400 }
      );
    }

    // Update user in DB
    await db.execute({
      sql: 'UPDATE users SET role = ? WHERE id = ?',
      args: [newRole, userId],
    });

    return NextResponse.json({
      success: true,
      message: `Função do usuário atualizada para "${newRole}"`,
    });
  } catch (err: unknown) {
    return internalServerError('Admin role update error:', err);
  }
}
