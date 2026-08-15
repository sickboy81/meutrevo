import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireAuthenticatedUser } from '@/lib/api-auth';
import { z } from 'zod';

const preferencesSchema = z.object({
  lotteryIds: z.array(z.string().min(1).max(32)).max(20).optional(),
  resultAvailable: z.boolean().optional(),
  gameChecked: z.boolean().optional(),
  prizeFound: z.boolean().optional(),
  scheduleReminder: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const result = await db.execute({
      sql: 'SELECT * FROM notification_preferences WHERE user_id = ? LIMIT 1',
      args: [user.id],
    });
    return NextResponse.json({
      preferences: result.rows[0] || {
        user_id: user.id,
        lottery_ids: [],
        result_available: true,
        game_checked: true,
        prize_found: true,
        schedule_reminder: false,
        email_enabled: false,
      },
    });
  } catch (error) {
    return internalServerError('Notification preferences read error:', error);
  }
}

export async function PUT(request: Request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response || !user) return response;
    const parsed = preferencesSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Preferências inválidas' },
        { status: 400 }
      );
    const value = parsed.data;
    await db.execute({
      sql: `INSERT INTO notification_preferences
        (user_id, lottery_ids, result_available, game_checked, prize_found, schedule_reminder, email_enabled)
        VALUES (?, ?, COALESCE(?, true), COALESCE(?, true), COALESCE(?, true), COALESCE(?, false), COALESCE(?, false))
        ON CONFLICT (user_id) DO UPDATE SET
          lottery_ids = COALESCE(EXCLUDED.lottery_ids, notification_preferences.lottery_ids),
          result_available = COALESCE(EXCLUDED.result_available, notification_preferences.result_available),
          game_checked = COALESCE(EXCLUDED.game_checked, notification_preferences.game_checked),
          prize_found = COALESCE(EXCLUDED.prize_found, notification_preferences.prize_found),
          schedule_reminder = COALESCE(EXCLUDED.schedule_reminder, notification_preferences.schedule_reminder),
          email_enabled = COALESCE(EXCLUDED.email_enabled, notification_preferences.email_enabled),
          updated_at = now()`,
      args: [
        user.id,
        JSON.stringify(value.lotteryIds || []),
        value.resultAvailable ?? null,
        value.gameChecked ?? null,
        value.prizeFound ?? null,
        value.scheduleReminder ?? null,
        value.emailEnabled ?? null,
      ],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError('Notification preferences update error:', error);
  }
}
