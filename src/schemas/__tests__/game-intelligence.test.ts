import { describe, expect, it } from 'vitest';
import {
  gameScoreSchema,
  generatedGameRecordSchema,
} from '../game-intelligence';

const validScore = {
  total: 75,
  label: 'Boa aderencia',
  criteria: [
    {
      id: 'parity',
      title: 'Paridade',
      points: 15,
      maxPoints: 20,
      explanation: 'A composicao respeita a faixa historica configurada.',
    },
  ],
  disclaimer:
    'Score de aderencia historica; nao representa previsao de premio.',
};

const validGeneratedGame = {
  id: 'generated_1',
  userId: 'user_1',
  lottery: 'megasena',
  selectedNumbers: [1, 2, 3, 4, 5, 6],
  source: 'smart_generator',
  score: validScore,
  analysisSnapshot: {
    lottery: 'megasena',
    cutoffContest: 2789,
    analyzedAt: '2026-08-15T17:00:00.000Z',
    dataWindow: {
      firstContest: 2690,
      lastContest: 2788,
      drawsAnalyzed: 99,
    },
    numberTemperatures: [
      {
        number: 1,
        classification: 'neutra',
        frequency: 12,
        recentFrequency: 4,
        delay: 3,
        lastOccurrence: 2786,
      },
    ],
  },
  createdAt: '2026-08-15T17:00:00.000Z',
  updatedAt: '2026-08-15T17:00:00.000Z',
};

describe('game intelligence schemas', () => {
  it.each([-1, 101])('rejects a score total outside 0..100: %i', (total) => {
    expect(gameScoreSchema.safeParse({ ...validScore, total }).success).toBe(
      false
    );
  });

  it('rejects selected number lists with duplicates or values outside the lottery range', () => {
    expect(
      generatedGameRecordSchema.safeParse({
        ...validGeneratedGame,
        selectedNumbers: [1, 2, 3, 4, 5, 5],
      }).success
    ).toBe(false);
    expect(
      generatedGameRecordSchema.safeParse({
        ...validGeneratedGame,
        selectedNumbers: [1, 2, 3, 4, 5, 61],
      }).success
    ).toBe(false);
  });

  it('rejects an unsupported generation source', () => {
    expect(
      generatedGameRecordSchema.safeParse({
        ...validGeneratedGame,
        source: 'prediction_engine',
      }).success
    ).toBe(false);
  });

  it('rejects an analysis snapshot without a historical cutoff', () => {
    expect(
      generatedGameRecordSchema.safeParse({
        ...validGeneratedGame,
        analysisSnapshot: {
          lottery: 'megasena',
          analyzedAt: '2026-08-15T17:00:00.000Z',
          dataWindow: {
            firstContest: 2690,
            lastContest: 2788,
            drawsAnalyzed: 99,
          },
          numberTemperatures: [
            {
              number: 1,
              classification: 'neutra',
              frequency: 12,
              recentFrequency: 4,
              delay: 3,
              lastOccurrence: 2786,
            },
          ],
        },
      }).success
    ).toBe(false);
  });
});
