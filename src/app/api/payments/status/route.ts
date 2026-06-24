import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');
    const confirm = searchParams.get('confirm') === 'true';

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento ausente' },
        { status: 400 }
      );
    }

    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;

    // Se for um ID simulado (Sandbox)
    if (paymentId.startsWith('mock_dep_')) {
      const apiKey = process.env.PIXGO_API_KEY;
      const sandboxMode = !apiKey || apiKey.startsWith('pk_placeholder');
      if (!sandboxMode) {
        return NextResponse.json(
          { error: 'Pagamento simulado indisponível fora do sandbox' },
          { status: 403 }
        );
      }

      if (confirm) {
        const premiumUntil = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        await db.execute({
          sql: "UPDATE users SET role = 'pro', premium_until = ? WHERE id = ?",
          args: [premiumUntil, user.id],
        });
        return NextResponse.json({
          success: true,
          data: {
            payment_id: paymentId,
            status: 'completed',
          },
        });
      }

      // Se não for para confirmar, verifica se o usuário já se tornou pro por outro meio
      const res = await db.execute({
        sql: 'SELECT role FROM users WHERE id = ? LIMIT 1',
        args: [user.id],
      });
      const currentRole = res.rows.length > 0 ? res.rows[0].role : 'free';

      return NextResponse.json({
        success: true,
        data: {
          payment_id: paymentId,
          status: currentRole === 'pro' ? 'completed' : 'pending',
        },
      });
    }

    // Pagamento Real
    const apiKey = process.env.PIXGO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave de API não configurada' },
        { status: 500 }
      );
    }

    const pixgoResponse = await fetch(
      `https://pixgo.org/api/v1/payment/${paymentId}/status`,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      }
    );

    const result = await pixgoResponse.json();

    if (!pixgoResponse.ok || !result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Erro ao consultar status no PixGo',
          details: result,
        },
        { status: pixgoResponse.status }
      );
    }

    const status = result.data.status;
    const externalId = result.data.external_id; // Este é o ID do usuário

    if (status === 'completed' && externalId) {
      const premiumUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      await db.execute({
        sql: "UPDATE users SET role = 'pro', premium_until = ? WHERE id = ?",
        args: [premiumUntil, externalId],
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return internalServerError('Status check error:', err);
  }
}
