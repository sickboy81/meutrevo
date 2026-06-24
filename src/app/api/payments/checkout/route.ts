import { NextResponse } from 'next/server';
import { db, ensureConfigTable } from '../../../../lib/db';
import {
  internalServerError,
  requireAuthenticatedUser,
} from '../../../../lib/api-auth';
import { isValidCpfCnpj } from '../../../../lib/br-documents';
import { getStripe, getStripePriceId, isStripeConfigured } from '@/lib/stripe';

async function ensureStripeColumns() {
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_customer_id TEXT')
    .catch(() => {});
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT')
    .catch(() => {});
  await db
    .execute('ALTER TABLE users ADD COLUMN stripe_subscription_status TEXT')
    .catch(() => {});
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    await ensureStripeColumns();

    const userProfileRes = await db.execute({
      sql: 'SELECT cpf_cnpj FROM users WHERE id = ? LIMIT 1',
      args: [user.id],
    });
    const userCpfCnpj = userProfileRes.rows[0]?.cpf_cnpj as string | undefined;

    await ensureConfigTable();
    const { planType, provider } = await request
      .json()
      .catch(() => ({ planType: 'monthly', provider: 'pixgo' }));

    // Fetch active prices from DB
    const configQuery = await db.execute('SELECT key, value FROM app_config');
    let priceMonthly = 14.9;
    let priceAnnualEquivalent = 129.9; // total anual

    configQuery.rows.forEach((row) => {
      if (row.key === 'price_monthly') {
        const val = parseFloat(row.value as string);
        if (!isNaN(val)) priceMonthly = val;
      }
      if (row.key === 'price_annual') {
        const val = parseFloat(row.value as string);
        if (!isNaN(val)) priceAnnualEquivalent = val;
      }
    });

    const isAnnual = planType === 'annual';
    const paymentProvider = provider === 'stripe' ? 'stripe' : 'pixgo';
    const finalAmount = isAnnual ? priceAnnualEquivalent : priceMonthly;
    const planDescription = isAnnual
      ? `Meu Trevo Pro Anual (R$ ${priceAnnualEquivalent.toFixed(2)} por ano)`
      : `Meu Trevo Pro Mensal (R$ ${priceMonthly.toFixed(2)}/mês)`;
    const origin = new URL(request.url).origin;

    if (paymentProvider === 'stripe') {
      if (!isStripeConfigured()) {
        return NextResponse.json(
          {
            error:
              'Stripe ainda não está configurado. Defina STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY_ID e STRIPE_PRICE_YEARLY_ID.',
          },
          { status: 400 }
        );
      }

      const stripe = getStripe();
      const priceId = getStripePriceId(isAnnual ? 'annual' : 'monthly');

      if (!priceId) {
        return NextResponse.json(
          { error: 'Preço Stripe do plano não configurado.' },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${origin}/app?upgrade=success&provider=stripe`,
        cancel_url: `${origin}/app?upgrade=cancel&provider=stripe`,
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
          planType: isAnnual ? 'annual' : 'monthly',
          provider: 'stripe',
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            planType: isAnnual ? 'annual' : 'monthly',
            provider: 'stripe',
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          provider: 'stripe',
          checkout_url: session.url,
          checkout_session_id: session.id,
        },
      });
    }

    const apiKey = process.env.PIXGO_API_KEY;
    const webhookUrl = `${origin}/api/payments/webhook`;

    // Se a API Key for do tipo placeholder, entra em modo Sandbox para testes locais
    if (!apiKey || apiKey.startsWith('pk_placeholder')) {
      const mockPaymentId = `mock_dep_${Math.random().toString(36).substring(2, 18)}`;
      const qrData = `00020126580014BR.GOV.BCB.PIX2572pixgo.org/mock-payment-${user.id}`;

      return NextResponse.json({
        success: true,
        data: {
          payment_id: mockPaymentId,
          external_id: user.id,
          amount: finalAmount,
          status: 'pending',
          qr_code: qrData,
          qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`,
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
      });
    }

    if (!userCpfCnpj) {
      return NextResponse.json(
        {
          error:
            'CPF/CNPJ obrigatório para gerar o Pix. Atualize seu perfil com o documento do pagador.',
        },
        { status: 400 }
      );
    }

    if (!isValidCpfCnpj(userCpfCnpj)) {
      return NextResponse.json(
        {
          error:
            'CPF/CNPJ inválido no perfil. Corrija o documento do pagador antes de gerar o Pix.',
        },
        { status: 400 }
      );
    }

    // Requisição real para a API do PixGo
    const payload = {
      amount: finalAmount,
      description: planDescription,
      receiver_name: user.name,
      receiver_email: user.email,
      receiver_cpf: userCpfCnpj,
      external_id: user.id,
      webhook_url: webhookUrl,
    };

    const pixgoResponse = await fetch(
      'https://pixgo.org/api/v1/payment/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await pixgoResponse.json();

    if (!pixgoResponse.ok || !result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Erro ao gerar pagamento no PixGo',
          details: result,
        },
        { status: pixgoResponse.status }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return internalServerError('Checkout error:', err);
  }
}
