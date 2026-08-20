import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { execute: vi.fn() },
}));

vi.mock('@/lib/rate-limit', () => ({
  consumeRateLimit: vi.fn().mockResolvedValue({ blocked: false, remaining: 29 }),
  createRateLimitExceededResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429 })
  ),
}));

import { db } from '@/lib/db';
import { GET } from './route';

describe('public bolao route (bolao_shares)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for non-existent share code', async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [] });

    const response = await GET(
      new Request('http://localhost/api/boloes/public/nonexistent'),
      { params: Promise.resolve({ shareCode: 'nonexistent' }) }
    );

    expect(response.status).toBe(404);
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('FROM bolao_shares'),
      })
    );
  });

  it('filters by is_active=true and revoked_at IS NULL', async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [] });

    await GET(
      new Request('http://localhost/api/boloes/public/abc12345'),
      { params: Promise.resolve({ shareCode: 'abc12345' }) }
    );

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('is_active = true'),
      })
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('revoked_at IS NULL'),
      })
    );
  });

  it('filters expired shares', async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [] });

    const response = await GET(
      new Request('http://localhost/api/boloes/public/abc12345'),
      { params: Promise.resolve({ shareCode: 'abc12345' }) }
    );

    expect(response.status).toBe(404);
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('expires_at IS NULL OR expires_at > NOW()'),
      })
    );
  });

  it('returns sanitized public data for an active share', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          lottery_id: 'megasena',
          lottery_name: 'Mega-Sena',
          contest_num: null,
          games_snapshot: JSON.stringify([['01', '02', '03', '04', '05', '06']]),
          cotas: 5,
          taxa: 10,
          summary_text: '',
          created_at: '2026-08-15T12:00:00.000Z',
        },
      ],
    });

    const response = await GET(
      new Request('http://localhost/api/boloes/public/abc12345'),
      { params: Promise.resolve({ shareCode: 'abc12345' }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lottery_name).toBe('Mega-Sena');
    expect(data.games).toHaveLength(1);
    expect(data.cotas).toBe(5);
    expect(data.taxa).toBe(10);
    // Must NOT expose user_id, email, CPF, or token
    expect(data.user_id).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.cpf).toBeUndefined();
    expect(data.token).toBeUndefined();
  });

  it('rejects invalid share codes', async () => {
    const response = await GET(
      new Request('http://localhost/api/boloes/public/ab'),
      { params: Promise.resolve({ shareCode: 'ab' }) }
    );

    expect(response.status).toBe(400);
  });
});
