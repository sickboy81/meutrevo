import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { db } from '../../../../lib/db';
import { internalServerError } from '../../../../lib/api-auth';
import { claimOneTimeToken } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const timestamp = headerList.get('x-webhook-timestamp') || '';
    const signature = headerList.get('x-webhook-signature') || '';
    const rawBody = await request.text();

    const webhookSecret = process.env.PIXGO_WEBHOOK_SECRET;

    // Se o segredo de webhook for placeholder, podemos ignorar assinatura para fins de teste local
    const bypassSignature =
      !webhookSecret || webhookSecret.startsWith('whsec_placeholder');

    if (!bypassSignature) {
      if (!timestamp || !signature) {
        return NextResponse.json(
          { error: 'Assinatura ou timestamp ausentes' },
          { status: 401 }
        );
      }

      const signaturePayload = timestamp + '.' + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signaturePayload)
        .digest('hex');

      try {
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const actualBuffer = Buffer.from(signature, 'hex');
        if (
          expectedBuffer.length !== actualBuffer.length ||
          !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
        ) {
          return NextResponse.json(
            { error: 'Assinatura inválida' },
            { status: 401 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Erro ao validar assinatura' },
          { status: 401 }
        );
      }

      // Prevenir ataques de replay (limite de 5 minutos)
      if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) {
        return NextResponse.json(
          { error: 'Timestamp expirado' },
          { status: 401 }
        );
      }
    }

    const replayFingerprint = crypto
      .createHash('sha256')
      .update(`${timestamp}:${signature}:${rawBody}`)
      .digest('hex');
    const firstDelivery = await claimOneTimeToken(
      `webhook:pixgo:${replayFingerprint}`,
      10 * 60_000
    );
    if (!firstDelivery) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === 'payment.completed') {
      const externalId = payload.data.external_id; // ID do usuário

      if (externalId) {
        const premiumUntil = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        await db.execute({
          sql: "UPDATE users SET role = 'pro', premium_until = ? WHERE id = ?",
          args: [premiumUntil, externalId],
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    return internalServerError('Webhook processing error:', err);
  }
}
