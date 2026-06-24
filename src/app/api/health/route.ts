import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const checks: Record<string, string> = {};

  // Verificar conexão com banco de dados
  try {
    await db.execute('SELECT 1 as ping');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const status = Object.values(checks).every((v) => v === 'ok')
    ? 'healthy'
    : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || '0.1.0',
    },
    {
      status: status === 'healthy' ? 200 : 503,
    }
  );
}
