import { db } from '@/lib/db';
import type { LotteryResult } from '@/app/types';
import { sendPushToUser } from '@/lib/push-server';
import { sendCustomEmail } from '@/lib/email';

function numbersFromGame(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed))
      return parsed.map(Number).filter(Number.isFinite);
    return String(parsed).split(',').map(Number).filter(Number.isFinite);
  } catch {
    return String(value).split(',').map(Number).filter(Number.isFinite);
  }
}

function prizeForHits(result: LotteryResult, hits: number): number {
  const rateio = result.listaRateioPremio || [];
  const matching = rateio.find(
    (item) =>
      item.faixa === hits ||
      Number(item.descricaoFaixa?.match(/\d+/)?.[0]) === hits
  );
  return Number(matching?.valorPremio || 0);
}

export async function checkScheduledGames(
  lottery: string,
  contest: number,
  result: LotteryResult
) {
  const pending = await db.execute({
    sql: `SELECT gs.id, gs.user_id, gs.plan_game_id, pg.numbers,
            u.email, u.name, COALESCE(np.email_enabled, false) AS email_enabled
          FROM game_schedules gs
          JOIN plan_games pg ON pg.id = gs.plan_game_id
          JOIN users u ON u.id = gs.user_id
          LEFT JOIN notification_preferences np ON np.user_id = gs.user_id
          WHERE gs.lottery = ?
            AND gs.contest_num = ?
            AND gs.status = 'pending'`,
    args: [lottery, contest],
  });
  const drawn = new Set((result.listaDezenas || []).map(Number));
  let checked = 0;
  for (const row of pending.rows) {
    const hits = numbersFromGame(row.numbers).filter((number) =>
      drawn.has(number)
    ).length;
    const prize = prizeForHits(result, hits);
    await db.execute({
      sql: `UPDATE game_schedules
            SET status = ?, hits = ?, prize_won = ?, checked_at = now()
            WHERE id = ? AND status = 'pending'`,
      args: [prize > 0 ? 'winner' : 'checked', hits, prize, row.id],
    });
    await sendPushToUser(String(row.user_id), {
      title: prize > 0 ? 'Jogo premiado' : 'Jogo conferido',
      body:
        prize > 0
          ? `${lottery} concurso ${contest}: ${hits} acertos e prêmio de R$ ${prize.toFixed(2).replace('.', ',')}.`
          : `${lottery} concurso ${contest}: ${hits} acertos.`,
      url: '/app?tab=plans',
      tag: `meu-trevo-${lottery}-${contest}-${row.id}`,
      preference: prize > 0 ? 'prize_found' : 'game_checked',
    });
    if (row.email_enabled === true) {
      try {
        await sendCustomEmail(
          String(row.email),
          prize > 0
            ? `Jogo premiado no concurso ${contest}`
            : `Jogo conferido no concurso ${contest}`,
          String(row.name || 'apostador'),
          `<p>Seu jogo de <strong>${lottery}</strong> foi conferido no concurso <strong>${contest}</strong>.</p>
           <p>Acertos: <strong>${hits}</strong>${prize > 0 ? ` · Prêmio estimado: <strong>R$ ${prize.toFixed(2).replace('.', ',')}</strong>` : ''}.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app?tab=plans" style="color:#67e8f9;">Abrir meus planos</a></p>`
        );
      } catch (error) {
        console.error('[Email] scheduled game notification failed', error);
      }
    }
    checked += 1;
  }
  return { checked };
}
