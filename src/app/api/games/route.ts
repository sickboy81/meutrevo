import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../lib/api-auth';
import { createGameSchema } from '@/schemas/games';

// 1. Listar jogos salvos do usuário
export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const res = await db.execute({
      sql: 'SELECT * FROM saved_games WHERE user_id = ? ORDER BY created_at DESC',
      args: [user.id],
    });
    return NextResponse.json({ success: true, games: res.rows });
  } catch (err: unknown) {
    return internalServerError('Games list error:', err);
  }
}

// 2. Salvar um novo jogo no banco
export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const body = await request.json();
    const parsed = createGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lottery, numbers } = parsed.data;
    const numbersJson = JSON.stringify(numbers);

    const gameId = crypto.randomUUID();

    await db.execute({
      sql: 'INSERT INTO saved_games (id, user_id, lottery, numbers) VALUES (?, ?, ?, ?)',
      args: [gameId, user.id, lottery, numbersJson],
    });

    return NextResponse.json({ success: true, gameId });
  } catch (err: unknown) {
    return internalServerError('Game create error:', err);
  }
}

// 3. Deletar um jogo salvo
export async function DELETE(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('id');

    if (!gameId) {
      return NextResponse.json(
        { error: 'ID do jogo ausente' },
        { status: 400 }
      );
    }

    // Verificar se o jogo pertence ao usuário logado antes de deletar
    const check = await db.execute({
      sql: 'SELECT id FROM saved_games WHERE id = ? AND user_id = ? LIMIT 1',
      args: [gameId, user.id],
    });

    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Jogo não encontrado ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    await db.execute({
      sql: 'DELETE FROM saved_games WHERE id = ?',
      args: [gameId],
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return internalServerError('Game delete error:', err);
  }
}
