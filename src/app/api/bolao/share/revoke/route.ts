import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { shareCode } = await request.json();

    if (!shareCode || typeof shareCode !== 'string') {
      return NextResponse.json(
        { error: 'Código de compartilhamento obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o share existe e pertence ao usuário autenticado
    const result = await db.execute({
      sql: `SELECT id, user_id FROM bolao_shares 
            WHERE share_code = ? AND user_id = ?
            LIMIT 1`,
      args: [shareCode.trim().toLowerCase(), user.id],
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Compartilhamento não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Revogar o compartilhamento
    await db.execute({
      sql: `UPDATE bolao_shares 
            SET revoked_at = NOW(), is_active = false
            WHERE share_code = ? AND user_id = ?`,
      args: [shareCode.trim().toLowerCase(), user.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bolão share revoke error:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
