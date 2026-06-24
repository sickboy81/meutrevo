import { NextResponse } from 'next/server';
import { db, ensureConfigTable } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';
import {
  consumeRateLimit,
  createRateLimitExceededResponse,
} from '@/lib/rate-limit';

export async function GET() {
  await ensureConfigTable();
  try {
    const res = await db.execute('SELECT key, value FROM app_config');
    const config: Record<string, string> = {};
    res.rows.forEach((row) => {
      config[row.key as string] = row.value as string;
    });
    return NextResponse.json({ success: true, config });
  } catch (err: unknown) {
    return internalServerError('Config read error:', err);
  }
}

export async function POST(request: Request) {
  await ensureConfigTable();
  try {
    // Rate limiting: 20 requests/min por IP para endpoints admin
    const { user, response } = await requireRole(['admin']);
    if (response) return response;

    const rl = await consumeRateLimit(
      request,
      { maxRequests: 20, windowMs: 60_000 },
      { scope: 'admin-config-user', userId: user?.id ?? null }
    );
    if (rl.blocked) {
      return createRateLimitExceededResponse(
        rl,
        'Muitas alterações administrativas em pouco tempo. Aguarde antes de tentar novamente.'
      );
    }

    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Campos "key" e "value" são obrigatórios' },
        { status: 400 }
      );
    }

    await db.execute({
      sql: 'INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)',
      args: [key, String(value)],
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
    });
  } catch (err: unknown) {
    return internalServerError('Config update error:', err);
  }
}
