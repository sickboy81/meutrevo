import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../lib/db';
import { internalServerError, requireRole } from '../../../lib/api-auth';

// 1. Listar apostas registradas do usuário
export async function GET() {
  try {
    const { user, response } = await requireRole(['pro', 'admin']);
    if (response || !user) return response;

    const res = await db.execute({
      sql: 'SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC',
      args: [user.id],
    });
    return NextResponse.json({ success: true, bets: res.rows });
  } catch (err: unknown) {
    return internalServerError('Bets list error:', err);
  }
}

// 2. Salvar uma nova aposta (registro financeiro)
export async function POST(request: Request) {
  try {
    const { user, response } = await requireRole(['pro', 'admin']);
    if (response || !user) return response;

    const { lottery, numbers, contest_num, cost, prize_won } =
      await request.json();

    if (
      !lottery ||
      !numbers ||
      contest_num === undefined ||
      cost === undefined ||
      prize_won === undefined
    ) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const betId = crypto.randomUUID();

    await db.execute({
      sql: 'INSERT INTO bets (id, user_id, lottery, numbers, contest_num, cost, prize_won) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [betId, user.id, lottery, numbers, contest_num, cost, prize_won],
    });

    return NextResponse.json({ success: true, betId });
  } catch (err: unknown) {
    return internalServerError('Bet create error:', err);
  }
}

// 3. Remover uma aposta do registro financeiro
export async function DELETE(request: Request) {
  try {
    const { user, response } = await requireRole(['pro', 'admin']);
    if (response || !user) return response;

    const { searchParams } = new URL(request.url);
    const betId = searchParams.get('id');

    if (!betId) {
      return NextResponse.json(
        { error: 'ID da aposta ausente' },
        { status: 400 }
      );
    }

    // Verificar propriedade
    const check = await db.execute({
      sql: 'SELECT id FROM bets WHERE id = ? AND user_id = ? LIMIT 1',
      args: [betId, user.id],
    });

    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Aposta não encontrada' },
        { status: 404 }
      );
    }

    await db.execute({
      sql: 'DELETE FROM bets WHERE id = ?',
      args: [betId],
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return internalServerError('Bet delete error:', err);
  }
}
