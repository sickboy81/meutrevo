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

    // Check if full
    if ((bolao.cotas_taken as number) >= (bolao.cotas_total as number)) {
      return NextResponse.json({ error: 'Bolão lotado!' }, { status: 400 });
    }

    const nextCota = (bolao.cotas_taken as number) + 1;
    const amountDue =
      (bolao.total_cost as number) / (bolao.cotas_total as number);

    // Join
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

    await db.execute({
      sql: `UPDATE boloes SET cotas_taken = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [nextCota, bolao.id],
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
