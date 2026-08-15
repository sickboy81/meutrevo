import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  analysisSnapshotSchema,
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

  it('rejects a score criterion with points above its maximum', () => {
    expect(
      gameScoreSchema.safeParse({
        ...validScore,
        criteria: [{ ...validScore.criteria[0], points: 21 }],
      }).success
    ).toBe(false);
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

  it('rejects a temperature number outside the snapshot lottery range', () => {
    expect(
      analysisSnapshotSchema.safeParse({
        ...validGeneratedGame.analysisSnapshot,
        numberTemperatures: [
          {
            ...validGeneratedGame.analysisSnapshot.numberTemperatures[0],
            number: 61,
          },
        ],
      }).success
    ).toBe(false);
  });

  it('rejects an analysis snapshot whose cutoff is not after its data window', () => {
    expect(
      analysisSnapshotSchema.safeParse({
        ...validGeneratedGame.analysisSnapshot,
        cutoffContest:
          validGeneratedGame.analysisSnapshot.dataWindow.lastContest,
      }).success
    ).toBe(false);
  });

  it('does not expose a user-supplied title from the public bolao function', () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260815170000_game_intelligence.sql'
      ),
      'utf8'
    );
    const publicBolaoFunction = migration.match(
      /create or replace function public\.get_public_bolao[\s\S]*?\$\$;/
    )?.[0];

    expect(publicBolaoFunction).toBeDefined();
    expect(publicBolaoFunction).not.toMatch(/\btitle\b/i);
  });

  it('drops the legacy public bolao RPC before redefining its return table', () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20260815170000_game_intelligence.sql'
      ),
      'utf8'
    );
    const legacyFunctionDrop =
      /^\s*drop function if exists public\.get_public_bolao\(text\);/im;
    const publicBolaoDefinition =
      /^\s*create or replace function public\.get_public_bolao\b/im;
    const dropMatch = migration.match(legacyFunctionDrop);
    const definitionMatch = migration.match(publicBolaoDefinition);

    expect(dropMatch).not.toBeNull();
    expect(definitionMatch).not.toBeNull();
    expect(dropMatch?.index).toBeLessThan(definitionMatch?.index ?? -1);
  });
});
