'use client';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export default function ScoreGauge({ score, size = 80 }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * (size / 2 - 6);
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80 ? '#00e676' : clamped >= 50 ? '#ffd600' : '#ff1744';
  const label =
    clamped >= 80
      ? 'Excelente'
      : clamped >= 50
        ? 'Bom'
        : clamped >= 30
          ? 'Regular'
          : 'Ruim';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
          }}
        />
      </svg>
      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color }}>
        {clamped}
      </span>
      <span
        style={{
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}
