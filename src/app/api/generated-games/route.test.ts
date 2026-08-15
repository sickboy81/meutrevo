import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-auth', () => ({
  internalServerError: vi.fn(() =>
    Response.json({ error: 'Erro interno no servidor' }, { status: 500 })
  ),
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { GET, POST } from './route';

const authenticatedUser = {
  id: 'user-a',
  email: 'user-a@example.com',
  name: 'User A',
  role: 'free' as const,
};

const snapshot = {
  lottery: 'megasena',
  cutoffContest: 2901,
  analyzedAt: '2026-08-15T12:00:00.000Z',
  dataWindow: {
    firstContest: 2800,
    lastContest: 2900,
    drawsAnalyzed: 101,
  },
  numberTemperatures: [
    {
      number: 1,
      classification: 'quente',
      frequency: 12,
      recentFrequency: 2,
      delay: 0,
      lastOccurrence: 2900,
    },
  ],
};

const payload = {
  lottery: 'megasena',
  selectedNumbers: [1, 2, 3, 4, 5, 6],
  source: 'smart_generator',
  strategyId: 'smart-generator@v1/balanced',
  score: {
    total: 80,
    label: 'Boa aderencia',
    criteria: [
      {
        id: 'sum-band',
        title: 'Faixa de soma',
        points: 10,
        maxPoints: 10,
        explanation: 'A soma esta na faixa historica.',
      },
    ],
    disclaimer:
      'Score de aderencia historica; nao representa previsao de premio.',
  },
  analysisSnapshot: snapshot,
};

describe('generated games route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      user: authenticatedUser,
      response: null,
    });
  });

  it('returns the authentication response before accessing generated history', async () => {
    const unauthorized = Response.json(
      { error: 'Nao autenticado' },
      { status: 401 }
    );
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      user: null,
      response: unauthorized as never,
    });

    const response = await GET(
      new Request('http://localhost/api/generated-games')
    );

    expect(response.status).toBe(401);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('rejects an invalid generated game before writing to the database', async () => {
    const response = await POST(
      new Request('http://localhost/api/generated-games', {
        method: 'POST',
        body: JSON.stringify({ ...payload, selectedNumbers: [1, 1, 2] }),
      })
    );

    expect(response.status).toBe(400);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('inserts the authenticated owner and immutable snapshot, never a client user id', async () => {
    vi.mocked(db.execute).mockResolvedValue({ rows: [] });

    const response = await POST(
      new Request('http://localhost/api/generated-games', {
        method: 'POST',
        body: JSON.stringify({ ...payload, userId: 'user-b' }),
      })
    );

    expect(response.status).toBe(201);
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO generated_games'),
        args: expect.arrayContaining([
          'user-a',
          JSON.stringify(payload.analysisSnapshot),
        ]),
      })
    );
  });

  it('lists only the authenticated owner with filters and a cursor page boundary', async () => {
    const createdAt = '2026-08-15T12:00:00.000Z';
    const cursor = Buffer.from(
      JSON.stringify({ createdAt, id: 'game-2' })
    ).toString('base64url');
    vi.mocked(db.execute).mockResolvedValue({
      rows: [
        {
          id: 'game-1',
          user_id: 'user-a',
          lottery: 'megasena',
          selected_numbers: payload.selectedNumbers,
          source: payload.source,
          strategy_id: payload.strategyId,
          score_json: payload.score,
          analysis_snapshot: snapshot,
          created_at: createdAt,
          updated_at: createdAt,
        },
      ],
    });

    const response = await GET(
      new Request(
        `http://localhost/api/generated-games?lottery=megasena&source=smart_generator&from=2026-08-01T00%3A00%3A00.000Z&to=2026-08-31T23%3A59%3A59.999Z&minScore=75&limit=1&cursor=${cursor}`
      )
    );

    expect(response.status).toBe(200);
    expect(db.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        sql: expect.stringContaining('user_id = ?'),
        args: [
          'user-a',
          'megasena',
          'smart_generator',
          '2026-08-01T00:00:00.000Z',
          '2026-08-31T23:59:59.999Z',
          75,
          createdAt,
          'game-2',
          2,
        ],
      })
    );

    const body = await response.json();
    expect(body.games).toEqual([
      expect.objectContaining({
        userId: 'user-a',
        analysisSnapshot: snapshot,
      }),
    ]);
    expect(body.nextCursor).toBeNull();
  });
});
