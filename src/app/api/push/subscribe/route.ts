import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireAuthenticatedUser, internalServerError } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { subscription } = await req.json();
    const endpoint = String(subscription?.endpoint || '').trim();
    const p256dh = String(subscription?.keys?.p256dh || '').trim();
    const auth = String(subscription?.keys?.auth || '').trim();
    if (!endpoint || endpoint.length > 2048 || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'Assinatura push inválida' },
        { status: 400 }
      );
    }
    await db.execute({
      sql: `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id,
              p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      args: [crypto.randomUUID(), user.id, endpoint, p256dh, auth],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError('Push subscription create error:', error);
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const { endpoint } = await req.json();
    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Endpoint inválido' }, { status: 400 });
    }
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?',
      args: [endpoint, user.id],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError('Push subscription delete error:', error);
  }
}

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const result = await db.execute({
      sql: 'SELECT COUNT(*)::int AS count FROM push_subscriptions WHERE user_id = ?',
      args: [user.id],
    });
    return NextResponse.json({ count: Number(result.rows[0]?.count || 0) });
  } catch (error) {
    return internalServerError('Push subscription count error:', error);
  }
}
