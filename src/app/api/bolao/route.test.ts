import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    batch: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/lottery-prices', () => ({
  getSimpleBetPrice: vi.fn(() => 5),
}));

import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { POST } from './route';

describe('POST /api/bolao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const res = await POST(
      new Request('http://localhost/api/bolao', {
        method: 'POST',
        body: JSON.stringify({
          lottery: 'megasena',
          title: 'x',
          games: [[1, 2, 3]],
        }),
      })
    );

    expect(res.status).toBe(401);
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('creates bolao and inserts share row in bolao_shares', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'User A',
      email: 'a@example.com',
      role: 'free',
    } as never);

    vi.mocked(db.batch).mockResolvedValue(undefined as never);

    const res = await POST(
      new Request('http://localhost/api/bolao', {
        method: 'POST',
        body: JSON.stringify({
          lottery: 'megasena',
          title: 'Bolão Teste',
          games: [
            ['01', '02', '03', '04', '05', '06'],
            ['07', '08', '09', '10', '11', '12'],
          ],
          cotas_total: 5,
          taxa_pct: 10,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(String(body.id)).toMatch(/^bol_/);
    expect(String(body.shareCode)).toMatch(/^[a-z0-9]{8}$/);

    expect(db.batch).toHaveBeenCalledTimes(1);
    const queries = vi.mocked(db.batch).mock.calls[0]?.[0] as Array<{
      sql: string;
      args: unknown[];
    }>;

    expect(queries.some((q) => q.sql.includes('INSERT INTO boloes'))).toBe(
      true
    );
    const shareInsert = queries.find((q) =>
      q.sql.includes('INSERT INTO bolao_shares')
    );
    expect(shareInsert).toBeTruthy();
    expect(shareInsert?.args).toEqual(
      expect.arrayContaining(['00000000-0000-0000-0000-000000000001'])
    );
  });
});
