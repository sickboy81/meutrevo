import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';

// GET: List user's bolões
export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shareCode = searchParams.get('code');

  try {
    // Get by share code (public)
    if (shareCode) {
      const result = await db.execute({
        sql: `SELECT b.*, u.name as creator_name FROM boloes b
              JOIN users u ON b.creator_id = u.id
              WHERE b.share_code = ? LIMIT 1`,
        args: [shareCode],
      });

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Bolão não encontrado' },
          { status: 404 }
        );
      }

      const bolao = result.rows[0];
      const participants = await db.execute({
        sql: `SELECT * FROM bolao_participants WHERE bolao_id = ? ORDER BY cota_num`,
        args: [bolao.id],
      });

      return NextResponse.json({
        bolao: { ...bolao, games: JSON.parse(bolao.games_json as string) },
        participants: participants.rows,
      });
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

    const priceMap: Record<string, number> = {
      megasena: 5,
      lotofacil: 2.5,
      quina: 2,
      lotomania: 2.5,
      diadesorte: 2,
      timemania: 2,
      loteca: 2,
      duplasena: 2.5,
      supersete: 2,
      maismilionaria: 3,
    };
    const gamePrice = priceMap[lottery] || 2;
    const totalCost = gamePrice * games.length;

    const id = `bol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const shareCode = Math.random().toString(36).slice(2, 10);

    await db.execute({
      sql: `INSERT INTO boloes (id, creator_id, lottery, title, games_json, total_cost, cotas_total, cotas_taken, taxa_pct, share_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
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
    });

    // Creator takes first cota
    await db.execute({
      sql: `INSERT INTO bolao_participants (id, bolao_id, user_id, cota_num, name, amount_due)
            VALUES (?, ?, ?, 1, ?, ?)`,
      args: [
        `bp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        id,
        user.id,
        user.name,
        totalCost / (cotas_total || 1),
      ],
    });

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
      sql: `DELETE FROM boloes WHERE id = ? AND creator_id = ?`,
      args: [id, user.id],
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Bolão DELETE error:', err);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
