'use client';

import type { GameMetrics } from '@/lib/lottery-math';

interface CriterionBarProps {
  label: string;
  value: number;
  max: number;
  good: boolean;
}

function CriterionBar({ label, value, max, good }: CriterionBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.7rem',
      }}
    >
      <span
        style={{ color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '6px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: good ? '#00e676' : '#ff1744',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          color: 'white',
          fontWeight: 'bold',
          width: '30px',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface QualityBreakdownProps {
  metrics: GameMetrics;
  config: {
    drawCount: number;
    expectedSumMin: number;
    expectedSumMax: number;
    expectedPrimesMin: number;
    expectedPrimesMax: number;
    expectedFibMin: number;
    expectedFibMax: number;
  };
}

export default function QualityBreakdown({
  metrics,
  config,
}: QualityBreakdownProps) {
  const sumIdeal =
    metrics.sum >= config.expectedSumMin &&
    metrics.sum <= config.expectedSumMax;
  const evenDiff = Math.abs(metrics.evenCount - config.drawCount / 2);
  const evenOk = evenDiff <= Math.ceil(config.drawCount * 0.15);
  const primesOk =
    metrics.primeCount >= config.expectedPrimesMin &&
    metrics.primeCount <= config.expectedPrimesMax;
  const fibOk =
    metrics.fibCount >= config.expectedFibMin &&
    metrics.fibCount <= config.expectedFibMax;
  const consecutiveOk =
    metrics.consecutivePairs <= Math.ceil(config.drawCount * 0.2);
  const quadrantsOk = metrics.quadrantsCount >= 3;
  const rangesOk =
    metrics.rangeBucketsCount >=
    Math.min(5, Math.max(3, Math.ceil(config.drawCount * 0.55)));
  const concentrationOk =
    metrics.maxRangeBucketLoad <=
    Math.ceil(config.drawCount / Math.min(5, config.drawCount)) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'white',
          fontWeight: 'bold',
          marginBottom: '0.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '0.25rem',
        }}
      >
        CRITÉRIOS
      </div>
      <CriterionBar
        label="Soma"
        value={metrics.sum}
        max={config.expectedSumMax}
        good={sumIdeal}
      />
      <CriterionBar
        label="Pares/Ímpares"
        value={Math.min(metrics.evenCount, metrics.oddCount)}
        max={Math.ceil(config.drawCount / 2)}
        good={evenOk}
      />
      <CriterionBar
        label="Primos"
        value={metrics.primeCount}
        max={config.expectedPrimesMax}
        good={primesOk}
      />
      <CriterionBar
        label="Fibonacci"
        value={metrics.fibCount}
        max={config.expectedFibMax}
        good={fibOk}
      />
      <CriterionBar
        label="Consecutivos"
        value={metrics.consecutivePairs}
        max={Math.ceil(config.drawCount * 0.2)}
        good={consecutiveOk}
      />
      <CriterionBar
        label="Quadrantes"
        value={metrics.quadrantsCount}
        max={4}
        good={quadrantsOk}
      />
      <CriterionBar
        label="Faixas"
        value={metrics.rangeBucketsCount}
        max={Math.min(5, config.drawCount)}
        good={rangesOk}
      />
      <CriterionBar
        label="Concentração"
        value={metrics.maxRangeBucketLoad}
        max={Math.ceil(config.drawCount / Math.min(5, config.drawCount)) + 2}
        good={concentrationOk}
      />
    </div>
  );
}
