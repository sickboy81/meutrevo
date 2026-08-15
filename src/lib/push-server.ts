import webpush from 'web-push';
import { db } from '@/lib/db';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  preference?:
    | 'result_available'
    | 'game_checked'
    | 'prize_found'
    | 'schedule_reminder';
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configureVapid()) return { sent: 0, skipped: true };
  if (payload.preference) {
    const preference = await db.execute({
      sql: `SELECT ${payload.preference} AS enabled
            FROM notification_preferences WHERE user_id = ? LIMIT 1`,
      args: [userId],
    });
    if (preference.rows.length && preference.rows[0]?.enabled === false) {
      return { sent: 0, skipped: true };
    }
  }
  const subscriptions = await db.execute({
    sql: 'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    args: [userId],
  });
  let sent = 0;
  for (const subscription of subscriptions.rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: String(subscription.endpoint),
          keys: {
            p256dh: String(subscription.p256dh),
            auth: String(subscription.auth),
          },
        },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.execute({
          sql: 'DELETE FROM push_subscriptions WHERE id = ? AND user_id = ?',
          args: [subscription.id, userId],
        });
      } else {
        console.error('[Push] notification delivery failed', error);
      }
    }
  }
  return { sent, skipped: false };
}
