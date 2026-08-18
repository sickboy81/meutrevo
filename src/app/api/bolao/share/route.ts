import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { generateShareCode, getShareUrl } from '@/lib/qr-share';
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
    const { lotteryId, contestNum, games, cotas, taxa, summaryText } =
      await request.json();

    // Validações básicas
    if (!lotteryId || !games || !Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos. lotteryId e games são obrigatórios.' },
        { status: 400 }
      );
    }

    if (cotas !== undefined && (typeof cotas !== 'number' || cotas < 1)) {
      return NextResponse.json(
        { error: 'Cotas deve ser um número maior ou igual a 1.' },
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

    const shareCode = generateShareCode();
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
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW())
      RETURNING id, share_code`,
      args: [
        shareCode,
        user.id,
        lotteryId,
        lotteryId, // lottery_name - pode ser melhorado depois
        contestNum || null,
        JSON.stringify(games),
        cotas || 1,
        taxa || 0,
        summaryText || '',
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
