import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getShareUrl } from '@/lib/qr-share';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { bolaoId } = await request.json();

    if (!bolaoId || typeof bolaoId !== 'string') {
      return NextResponse.json(
        { error: 'bolaoId é obrigatório' },
        { status: 400 }
      );
    }

    // Rate limit: máximo 10 shares por usuário por hora
    const limit = await consumeRateLimit(
      request,
      { maxRequests: 10, windowMs: 60 * 60_000 },
      { scope: 'bolao-share', userId: user.id }
    );
    if (limit.blocked) {
      return createRateLimitExceededResponse(
        limit,
        'Limite de compartilhamentos atingido. Tente novamente mais tarde.'
      );
    }

    const bolaoResult = await db.execute({
      sql: `SELECT id, creator_id, lottery, games_json, cotas_total, taxa_pct, share_code
            FROM boloes
            WHERE id = ? AND creator_id = ?
            LIMIT 1`,
      args: [bolaoId, user.id],
    });

    if (!bolaoResult.rows || bolaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bolão não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const bolao = bolaoResult.rows[0] as {
      lottery: string;
      games_json: string;
      cotas_total: number;
      taxa_pct: number;
      share_code: string;
    };

    const shareCode = String(bolao.share_code || '')
      .trim()
      .toLowerCase();
    if (!shareCode) {
      return NextResponse.json(
        { error: 'Bolão sem share_code' },
        { status: 500 }
      );
    }

    const shareUrl = getShareUrl(shareCode);

    // Inserir no banco de dados
    const result = await db.execute({
      sql: `INSERT INTO bolao_shares (
        share_code,
        user_id,
        lottery_id,
        lottery_name,
        contest_num,
        games_snapshot,
        cotas,
        taxa,
        summary_text,
        is_active,
        created_at,
        revoked_at,
        expires_at
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, '', true, NOW(), NULL, NULL)
      ON CONFLICT (share_code) DO UPDATE SET
        games_snapshot = EXCLUDED.games_snapshot,
        cotas = EXCLUDED.cotas,
        taxa = EXCLUDED.taxa,
        is_active = true,
        revoked_at = NULL,
        expires_at = NULL
      RETURNING id, share_code`,
      args: [
        shareCode,
        user.id,
        bolao.lottery,
        LOTTERY_CONFIGS[bolao.lottery]?.name || bolao.lottery,
        bolao.games_json,
        bolao.cotas_total || 1,
        bolao.taxa_pct || 0,
      ],
    });

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao criar compartilhamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareCode,
      shareUrl,
    });
  } catch (error) {
    console.error('Bolão share POST error:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
