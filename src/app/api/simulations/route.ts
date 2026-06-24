import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../lib/api-auth';

// 1. Listar simulações salvas do usuário
export async function GET(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const { searchParams } = new URL(request.url);
    const lottery = searchParams.get('lottery');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');
    const sort = searchParams.get('sort') || 'desc';

    let sql = 'SELECT * FROM saved_simulations WHERE user_id = ?';
    const args: (string | number)[] = [user.id];

    if (lottery) {
      sql += ' AND lottery = ?';
      args.push(lottery);
    }
    if (dateStart) {
      sql += ' AND created_at >= ?';
      args.push(dateStart);
    }
    if (dateEnd) {
      sql += ' AND created_at <= ?';
      args.push(dateEnd);
    }

    sql += ` ORDER BY created_at ${sort === 'asc' ? 'ASC' : 'DESC'}`;

    const res = await db.execute({ sql, args });
    return NextResponse.json({ success: true, simulations: res.rows });
  } catch (err: unknown) {
    return internalServerError('Simulations list error:', err);
  }
}

// 2. Salvar simulação no banco
export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const { lottery, numbers, max_hits, hits_count } = await request.json();

    if (
      !lottery ||
      !numbers ||
      max_hits === undefined ||
      hits_count === undefined
    ) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const simId = crypto.randomUUID();

    await db.execute({
      sql: 'INSERT INTO saved_simulations (id, user_id, lottery, numbers, max_hits, hits_count) VALUES (?, ?, ?, ?, ?, ?)',
      args: [simId, user.id, lottery, numbers, max_hits, hits_count],
    });

    return NextResponse.json({ success: true, simId });
  } catch (err: unknown) {
    return internalServerError('Simulation create error:', err);
  }
}

// 3. Remover simulação do histórico
export async function DELETE(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    const { searchParams } = new URL(request.url);
    const simId = searchParams.get('id');

    if (!simId) {
      return NextResponse.json(
        { error: 'ID da simulação ausente' },
        { status: 400 }
      );
    }

    // Verificar propriedade
    const check = await db.execute({
      sql: 'SELECT id FROM saved_simulations WHERE id = ? AND user_id = ? LIMIT 1',
      args: [simId, user.id],
    });

    if (check.rows.length === 0) {
      return NextResponse.json(
        { error: 'Simulação não encontrada' },
        { status: 404 }
      );
    }

    await db.execute({
      sql: 'DELETE FROM saved_simulations WHERE id = ?',
      args: [simId],
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return internalServerError('Simulation delete error:', err);
  }
}
