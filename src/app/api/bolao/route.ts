import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getSimpleBetPrice } from '@/lib/lottery-prices';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';

// GET: List user's bolões
export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shareCode = searchParams.get('code');

  try {
    if (shareCode) {
      return NextResponse.json(
        {
          error:
            'Esta rota de compartilhamento foi descontinuada. Use o link público do bolão.',
        },
        { status: 410 }
      );
    }

    // List user's bolões
    const created = await db.execute({
      sql: `SELECT b.*, u.name as creator_name FROM boloes b
            JOIN users u ON b.creator_id = u.id
            WHERE b.creator_id = ?
            ORDER BY b.created_at DESC LIMIT 50`,
      args: [user.id],
    });

    const joined = await db.execute({
      sql: `SELECT b.*, u.name as creator_name, bp.cota_num, bp.paid, bp.amount_received
            FROM bolao_participants bp
            JOIN boloes b ON bp.bolao_id = b.id
            JOIN users u ON b.creator_id = u.id
            WHERE bp.user_id = ?
            ORDER BY b.created_at DESC LIMIT 50`,
      args: [user.id],
    });

    return NextResponse.json({
      created: created.rows.map((r) => ({
        ...r,
        games: JSON.parse(r.games_json as string),
      })),
      joined: joined.rows.map((r) => ({
        ...r,
        games: JSON.parse(r.games_json as string),
      })),
    });
  } catch (err) {
    console.error('Bolão GET error:', err);
    return NextResponse.json({ created: [], joined: [] });
  }
}

// POST: Create a new bolão
export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { lottery, title, games, cotas_total, taxa_pct } = await req.json();

    if (!lottery || !title || !games || games.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const gamePrice = getSimpleBetPrice(lottery);
    const totalCost = gamePrice * games.length;

    const id = `bol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shareCode = Math.random().toString(36).slice(2, 10);

    // Keep the bolão, its share record and the creator's cota atomic.
    await db.batch([
      {
        sql: `INSERT INTO boloes (id, creator_id, lottery, title, games_json, total_cost, cotas_total, cotas_taken, taxa_pct, share_code)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
              ON CONFLICT (id) DO NOTHING`,
        args: [
          id,
          user.id,
          lottery,
          title,
          JSON.stringify(games.map((g: string[]) => g.map(String))),
          totalCost,
          cotas_total || 1,
          taxa_pct || 0,
          shareCode,
        ],
      },
      {
        sql: `INSERT INTO bolao_shares (share_code, user_id, lottery_id, lottery_name, games_snapshot, cotas, taxa, summary_text, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, '', true)
              ON CONFLICT (share_code) DO NOTHING`,
        args: [
          shareCode,
          user.id,
          lottery,
          LOTTERY_CONFIGS[lottery as keyof typeof LOTTERY_CONFIGS]?.name ||
            lottery,
          JSON.stringify(games.map((g: string[]) => g.map(String))),
          cotas_total || 1,
          taxa_pct || 0,
        ],
      },
      {
        sql: `INSERT INTO bolao_participants (id, bolao_id, user_id, cota_num, name, amount_due)
              VALUES (?, ?, ?, 1, ?, ?)
              ON CONFLICT (bolao_id, user_id) DO NOTHING`,
        args: [
          `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          id,
          user.id,
          user.name,
          totalCost / (cotas_total || 1),
        ],
      },
    ]);

    return NextResponse.json({ success: true, id, shareCode });
  } catch (err) {
    console.error('Bolão POST error:', err);
    return NextResponse.json({ error: 'Erro ao criar bolão' }, { status: 500 });
  }
}

// DELETE: Remove a bolão
export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  try {
    const ownership = await db.execute({
      sql: `SELECT creator_id FROM boloes WHERE id = ?`,
      args: [id],
    });

    if (ownership.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bolão não encontrado' },
        { status: 404 }
      );
    }

    if (ownership.rows[0].creator_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await db.execute({
      sql: `DELETE FROM bolao_participants WHERE bolao_id = ?`,
      args: [id],
    });
    await db.execute({
      sql: `DELETE FROM bolao_shares WHERE share_code IN (SELECT share_code FROM boloes WHERE id = ? AND creator_id = ?)`,
      args: [id, user.id],
    });
    await db.execute({
      sql: `DELETE FROM boloes WHERE id = ? AND creator_id = ?`,
      args: [id, user.id],
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Bolão DELETE error:', err);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
