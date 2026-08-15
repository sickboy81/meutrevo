import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { execute: vi.fn() },
}));

import { db } from '@/lib/db';
import { GET } from './route';

describe('public bolao route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('only reads active, non-revoked public access records', async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [] });

    const response = await GET(
      new Request('http://localhost/api/boloes/public/abc12345'),
      { params: Promise.resolve({ shareCode: 'abc12345' }) }
    );

    expect(response.status).toBe(404);
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('FROM bolao_public_access access'),
      })
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('access.is_active = true'),
      })
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('access.revoked_at IS NULL'),
      })
    );
  });

  it('returns the public summary for an active link without participants', async () => {
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          id: 'bol_1',
          lottery: 'megasena',
          title: 'Grupo',
          games_json: JSON.stringify([['01', '02', '03', '04', '05', '06']]),
          total_cost: '6.00',
          cotas_total: 2,
          cotas_taken: 1,
          taxa_pct: '0',
          status: 'active',
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
    expect(data.bolao.totalCost).toBe(6);
    expect(data.bolao.games).toHaveLength(1);
    expect(data.participants).toBeUndefined();
  });
});
