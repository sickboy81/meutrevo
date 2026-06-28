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
      { maxRequests: 10, windowMs: 60_000 },
      { scope: 'admin-delete-user', userId: user?.id ?? null }
    );
    if (rl.blocked) {
      return createRateLimitExceededResponse(
        rl,
        'Muitas remoções de usuário em pouco tempo. Aguarde antes de tentar novamente.'
      );
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'O campo "userId" é obrigatório' },
        { status: 400 }
      );
    }

    // Prevent deleting oneself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta de administrador' },
        { status: 400 }
      );
    }

    // Verify if the user exists
    const userCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ? LIMIT 1',
      args: [userId],
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Clean up all related tables in a batch/sequence
    await db.batch(
      [
        { sql: 'DELETE FROM saved_games WHERE user_id = ?', args: [userId] },
        {
          sql: 'DELETE FROM saved_simulations WHERE user_id = ?',
          args: [userId],
        },
        { sql: 'DELETE FROM bets WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM rankings WHERE user_id = ?', args: [userId] },
        {
          sql: 'DELETE FROM push_subscriptions WHERE user_id = ?',
          args: [userId],
        },
        {
          sql: 'DELETE FROM bolao_participants WHERE user_id = ?',
          args: [userId],
        },
        { sql: 'DELETE FROM boloes WHERE creator_id = ?', args: [userId] },
        { sql: 'DELETE FROM users WHERE id = ?', args: [userId] },
      ],
      'write'
    );

    return NextResponse.json({
      success: true,
      message:
        'Usuário e todos os dados associados foram removidos com sucesso',
    });
  } catch (err: unknown) {
    return internalServerError('Admin user delete error:', err);
  }
}
