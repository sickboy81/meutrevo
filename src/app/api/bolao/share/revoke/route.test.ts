import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { POST } from './route';

describe('POST /api/bolao/share/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

    const res = await POST(
      new Request('http://localhost/api/bolao/share/revoke', {
        method: 'POST',
        body: JSON.stringify({ shareCode: 'abc12345' }),
      })
    );

    expect(res.status).toBe(401);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('rejects missing shareCode', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: 'user-a',
      name: 'User A',
      email: 'a@example.com',
      role: 'free',
    } as never);

    const res = await POST(
      new Request('http://localhost/api/bolao/share/revoke', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    );

    expect(res.status).toBe(400);
  });

  it('revokes when the authenticated user owns the share', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: 'user-a',
      name: 'User A',
      email: 'a@example.com',
      role: 'free',
    } as never);

    vi.mocked(db.execute)
      .mockResolvedValueOnce({
        rows: [{ id: 's1', user_id: 'user-a' }],
      } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(
      new Request('http://localhost/api/bolao/share/revoke', {
        method: 'POST',
        body: JSON.stringify({ shareCode: 'abc12345' }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('SELECT id, user_id FROM bolao_shares'),
      })
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining(
          'SET revoked_at = NOW(), is_active = false'
        ),
      })
    );
  });

  it('blocks revocation by another user', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      id: 'user-b',
      name: 'User B',
      email: 'b@example.com',
      role: 'free',
    } as never);

    vi.mocked(db.execute).mockResolvedValueOnce({ rows: [] } as never);

    const res = await POST(
      new Request('http://localhost/api/bolao/share/revoke', {
        method: 'POST',
        body: JSON.stringify({ shareCode: 'abc12345' }),
      })
    );

    expect(res.status).toBe(404);
    expect(vi.mocked(db.execute).mock.calls.length).toBe(1);
  });
});
