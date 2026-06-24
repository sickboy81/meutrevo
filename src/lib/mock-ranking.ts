// Mock ranking data — fake users shown when real leaderboard is empty.
// As real users accumulate stats, they replace mock entries naturally.

export interface MockLeaderboardEntry {
  name: string;
  avatar: string;
  total_bets: number;
  total_hits: number;
  best_hit: number;
  total_prize: number;
  avg_hits: number;
}

// Realistic Brazilian names + lottery-themed usernames
export const MOCK_RANKING: MockLeaderboardEntry[] = [
  {
    name: 'carlos_silva92',
    avatar: '🍀',
    total_bets: 284,
    total_hits: 412,
    best_hit: 14,
    total_prize: 8750,
    avg_hits: 1.5,
  },
  {
    name: 'Maria Santos',
    avatar: '🎯',
    total_bets: 196,
    total_hits: 298,
    best_hit: 13,
    total_prize: 5430,
    avg_hits: 1.5,
  },
  {
    name: 'jose_souza',
    avatar: '🌟',
    total_bets: 312,
    total_hits: 267,
    best_hit: 12,
    total_prize: 3200,
    avg_hits: 0.9,
  },
  {
    name: 'Ana Paula',
    avatar: '🔮',
    total_bets: 145,
    total_hits: 231,
    best_hit: 14,
    total_prize: 12100,
    avg_hits: 1.6,
  },
  {
    name: 'Pedro_Henrique',
    avatar: '🎲',
    total_bets: 278,
    total_hits: 198,
    best_hit: 11,
    total_prize: 1890,
    avg_hits: 0.7,
  },
  {
    name: 'Lúcia',
    avatar: '🍀',
    total_bets: 89,
    total_hits: 176,
    best_hit: 13,
    total_prize: 6700,
    avg_hits: 2.0,
  },
  {
    name: 'roberto_nascimento',
    avatar: '🎯',
    total_bets: 201,
    total_hits: 165,
    best_hit: 12,
    total_prize: 2100,
    avg_hits: 0.8,
  },
  {
    name: 'Fernanda Lima',
    avatar: '🌟',
    total_bets: 167,
    total_hits: 154,
    best_hit: 11,
    total_prize: 1450,
    avg_hits: 0.9,
  },
  {
    name: 'Marcos55',
    avatar: '🔮',
    total_bets: 340,
    total_hits: 143,
    best_hit: 10,
    total_prize: 890,
    avg_hits: 0.4,
  },
  {
    name: 'Juliana B.',
    avatar: '🎲',
    total_bets: 123,
    total_hits: 138,
    best_hit: 12,
    total_prize: 3100,
    avg_hits: 1.1,
  },
  {
    name: 'Francisco das Chagas',
    avatar: '🍀',
    total_bets: 256,
    total_hits: 127,
    best_hit: 11,
    total_prize: 1670,
    avg_hits: 0.5,
  },
  {
    name: 'mari_dias',
    avatar: '🎯',
    total_bets: 98,
    total_hits: 119,
    best_hit: 13,
    total_prize: 4500,
    avg_hits: 1.2,
  },
  {
    name: 'Toninho',
    avatar: '🌟',
    total_bets: 189,
    total_hits: 112,
    best_hit: 10,
    total_prize: 780,
    avg_hits: 0.6,
  },
  {
    name: 'Patrícia Costa',
    avatar: '🔮',
    total_bets: 134,
    total_hits: 105,
    best_hit: 11,
    total_prize: 1230,
    avg_hits: 0.8,
  },
  {
    name: 'JoaoPedro2024',
    avatar: '🎲',
    total_bets: 310,
    total_hits: 98,
    best_hit: 9,
    total_prize: 450,
    avg_hits: 0.3,
  },
  {
    name: 'Sandra Regina',
    avatar: '🍀',
    total_bets: 76,
    total_hits: 94,
    best_hit: 12,
    total_prize: 2800,
    avg_hits: 1.2,
  },
  {
    name: 'paulo_ribeiro',
    avatar: '🎯',
    total_bets: 198,
    total_hits: 87,
    best_hit: 10,
    total_prize: 670,
    avg_hits: 0.4,
  },
  {
    name: 'Camila Ferreira',
    avatar: '🌟',
    total_bets: 112,
    total_hits: 82,
    best_hit: 11,
    total_prize: 980,
    avg_hits: 0.7,
  },
  {
    name: 'Ricardão',
    avatar: '🔮',
    total_bets: 267,
    total_hits: 76,
    best_hit: 9,
    total_prize: 340,
    avg_hits: 0.3,
  },
  {
    name: 'terezinha_10',
    avatar: '🎲',
    total_bets: 87,
    total_hits: 71,
    best_hit: 10,
    total_prize: 560,
    avg_hits: 0.8,
  },
];

/**
 * Merge real leaderboard entries with mock data.
 * Real entries always appear first; mock entries fill remaining slots.
 * Mock entries get negative user_ids so they never collide with real ones.
 */
export function mergeWithMockRanking(
  realEntries: Array<{
    position: number;
    name: string;
    user_id: string;
    total_bets: number;
    total_hits: number;
    best_hit: number;
    total_prize: number;
    avg_hits: number;
  }>,
  maxSlots: number = 20
): Array<{
  position: number;
  name: string;
  user_id: string;
  total_bets: number;
  total_hits: number;
  best_hit: number;
  total_prize: number;
  avg_hits: number;
  is_mock?: boolean;
}> {
  const realCount = realEntries.length;

  if (realCount >= maxSlots) {
    // Enough real users — no mocks needed
    return realEntries
      .slice(0, maxSlots)
      .map((e, i) => ({ ...e, position: i + 1 }));
  }

  // Fill remaining slots with mock entries
  const needed = maxSlots - realCount;
  const mockSlice = MOCK_RANKING.slice(0, needed);

  const merged = [
    ...realEntries.map((e, i) => ({ ...e, position: i + 1 })),
    ...mockSlice.map((m, i) => ({
      position: realCount + i + 1,
      name: m.name,
      user_id: `mock_${i}`,
      total_bets: m.total_bets,
      total_hits: m.total_hits,
      best_hit: m.best_hit,
      total_prize: m.total_prize,
      avg_hits: m.avg_hits,
      is_mock: true,
    })),
  ];

  return merged;
}
