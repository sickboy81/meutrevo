import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';

// POST: Join a bolão
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { shareCode } = await req.json();

    if (!shareCode) {
      return NextResponse.json(
        { error: 'Código obrigatório' },
        { status: 400 }
      );
    }

    // Find bolão
    const bolaoResult = await db.execute({
      sql: `SELECT * FROM boloes WHERE share_code = ? AND status = 'active' LIMIT 1`,
      args: [shareCode],
    });

    if (bolaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bolão não encontrado ou encerrado' },
        { status: 404 }
      );
    }

    const bolao = bolaoResult.rows[0];

    // Check if already joined
    const alreadyJoined = await db.execute({
      sql: `SELECT id FROM bolao_participants WHERE bolao_id = ? AND user_id = ? LIMIT 1`,
      args: [bolao.id, user.id],
    });

    if (alreadyJoined.rows.length > 0) {
      return NextResponse.json(
        { error: 'Você já participa deste bolão' },
        { status: 400 }
      );
    }

    const cotasTaken = bolao.cotas_taken as number;
    const cotasTotal = bolao.cotas_total as number;
    const totalCost = bolao.total_cost as number;

    if (cotasTaken >= cotasTotal) {
      return NextResponse.json({ error: 'Bolão lotado!' }, { status: 400 });
    }

    // Atomic claim: only succeeds if cotas_taken hasn't changed since read
    const claimed = await db.execute({
      sql: `UPDATE boloes SET cotas_taken = cotas_taken + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND cotas_taken = ? AND cotas_taken < cotas_total`,
      args: [bolao.id, cotasTaken],
    });

    if (claimed.rowsAffected === 0) {
      return NextResponse.json({ error: 'Bolão lotado!' }, { status: 400 });
    }

    const nextCota = cotasTaken + 1;
    const amountDue = totalCost / cotasTotal;

    await db.execute({
      sql: `INSERT INTO bolao_participants (id, bolao_id, user_id, cota_num, name, amount_due)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bolao.id,
        user.id,
        nextCota,
        user.name,
        amountDue,
      ],
    });

    return NextResponse.json({
      success: true,
      cota: nextCota,
      amount_due: amountDue,
    });
  } catch (err) {
    console.error('Bolão JOIN error:', err);
    return NextResponse.json(
      { error: 'Erro ao entrar no bolão' },
      { status: 500 }
    );
  }
}
