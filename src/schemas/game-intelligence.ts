import { z } from 'zod';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import { LOTTERY_IDS } from './games';

const historicalScoreDisclaimer =
  'Score de aderencia historica; nao representa previsao de premio.';

const historicalAnalysisDisclaimer =
  'Analise historica descritiva; nao representa previsao de premio.';

const moneySchema = z.number().finite().min(0);

export const lotteryIdSchema = z.enum(LOTTERY_IDS);

export const scoreBreakdownSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  points: z.number().finite().min(0),
  maxPoints: z.number().finite().positive(),
  explanation: z.string().trim().min(1).max(500),
});

export const gameScoreSchema = z.object({
  total: z.number().int().min(0).max(100),
  label: z.enum(['Excelente aderencia', 'Boa aderencia', 'Aderencia parcial']),
  criteria: z.array(scoreBreakdownSchema).min(1),
  disclaimer: z.literal(historicalScoreDisclaimer),
});

export const numberTemperatureSchema = z.object({
  number: z.number().int().min(0).max(99),
  classification: z.enum(['quente', 'neutra', 'fria']),
  frequency: z.number().finite().min(0),
  recentFrequency: z.number().finite().min(0),
  delay: z.number().int().min(0),
  lastOccurrence: z.number().int().positive().nullable(),
});

const analysisWindowSchema = z
  .object({
    firstContest: z.number().int().positive(),
    lastContest: z.number().int().positive(),
    drawsAnalyzed: z.number().int().positive(),
  })
  .superRefine((window, context) => {
    if (window.lastContest < window.firstContest) {
      context.addIssue({
        code: 'custom',
        path: ['lastContest'],
        message: 'O ultimo concurso deve ser igual ou posterior ao primeiro.',
      });
    }
  });

export const analysisSnapshotSchema = z.object({
  lottery: lotteryIdSchema,
  cutoffContest: z.number().int().positive(),
  analyzedAt: z.string().datetime(),
  dataWindow: analysisWindowSchema,
  numberTemperatures: z.array(numberTemperatureSchema).min(1),
  disclaimer: z.literal(historicalAnalysisDisclaimer).optional(),
});

export const generationSourceSchema = z.enum([
  'smart_generator',
  'strategy',
  'closure',
  'bolao',
  'manual',
]);

export const generatedGameRecordSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    userId: z.string().trim().min(1).max(120),
    lottery: lotteryIdSchema,
    selectedNumbers: z.array(z.number().int()).min(1).max(50),
    source: generationSourceSchema,
    strategyId: z.string().trim().min(1).max(120).optional(),
    score: gameScoreSchema,
    analysisSnapshot: analysisSnapshotSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((record, context) => {
    const config = LOTTERY_CONFIGS[record.lottery];

    if (record.selectedNumbers.length !== config.drawCount) {
      context.addIssue({
        code: 'custom',
        path: ['selectedNumbers'],
        message: `O jogo deve ter ${config.drawCount} dezenas.`,
      });
    }

    if (
      new Set(record.selectedNumbers).size !== record.selectedNumbers.length
    ) {
      context.addIssue({
        code: 'custom',
        path: ['selectedNumbers'],
        message: 'O jogo nao pode repetir dezenas.',
      });
    }

    if (
      record.selectedNumbers.some(
        (number) => number < config.minNum || number > config.maxNum
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['selectedNumbers'],
        message: `As dezenas devem estar entre ${config.minNum} e ${config.maxNum}.`,
      });
    }

    if (record.analysisSnapshot.lottery !== record.lottery) {
      context.addIssue({
        code: 'custom',
        path: ['analysisSnapshot', 'lottery'],
        message: 'O snapshot deve corresponder a mesma loteria do jogo.',
      });
    }
  });

export const costQuoteSchema = z.object({
  lottery: lotteryIdSchema,
  simpleGames: z.number().int().min(0),
  closureGames: z.number().int().min(0),
  bolaoQuotas: z.number().int().positive().optional(),
  subtotal: moneySchema,
  fee: moneySchema,
  total: moneySchema,
  costPerQuota: moneySchema.optional(),
  assumptions: z.array(z.string().trim().min(1).max(300)).min(1),
});

export const closureGuaranteeSchema = z.object({
  poolSize: z.number().int().positive(),
  gamesProduced: z.number().int().positive(),
  requiredHitsInPool: z.number().int().positive(),
  guaranteedTier: z.string().trim().min(1).max(120),
  verifiedCoverage: z.boolean(),
  condition: z.string().trim().min(1).max(500),
  limitations: z.array(z.string().trim().min(1).max(300)).min(1),
  disclaimer: z.literal(
    'Cobertura combinatoria condicional; nao representa garantia de premio.'
  ),
});

export const backtestResultSchema = z.object({
  lottery: lotteryIdSchema,
  strategyId: z.string().trim().min(1).max(120),
  strategyVersion: z.string().trim().min(1).max(80),
  contestsEvaluated: z.number().int().positive(),
  strategyMeanHits: z.number().finite().min(0),
  controlMeanHits: z.number().finite().min(0),
  conclusion: z.enum([
    'vantagem observada',
    'resultado inconclusivo',
    'resultado inferior ao controle',
  ]),
  disclaimer: z.literal(
    'Este teste compara desempenho historico fora da amostra. Ele nao garante repeticao futura nem altera as probabilidades oficiais da loteria.'
  ),
});

export type GameScore = z.infer<typeof gameScoreSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type NumberTemperature = z.infer<typeof numberTemperatureSchema>;
export type GeneratedGameRecord = z.infer<typeof generatedGameRecordSchema>;
export type CostQuote = z.infer<typeof costQuoteSchema>;
export type ClosureGuarantee = z.infer<typeof closureGuaranteeSchema>;
export type BacktestResult = z.infer<typeof backtestResultSchema>;
