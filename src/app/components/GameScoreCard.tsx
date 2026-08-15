import type { GameScore } from '@/schemas/game-intelligence';

interface GameScoreCardProps {
  score: GameScore;
}

const cardStyle = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  padding: '1rem',
  border: '1px solid var(--glass-border)',
  borderRadius: '0.75rem',
  background: 'var(--bg-secondary)',
};

export default function GameScoreCard({ score }: GameScoreCardProps) {
  return (
    <section aria-labelledby="game-score-card-title" style={cardStyle}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem 1rem',
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            id="game-score-card-title"
            style={{ fontSize: '1rem', color: 'var(--text-main)' }}
          >
            Aderência histórica
          </h2>
          <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            {score.label}
          </p>
        </div>
        <strong
          aria-label={`Pontuação total: ${score.total} de 100`}
          style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}
        >
          {score.total}/100
        </strong>
      </div>

      <ul
        aria-label="Critérios da aderência histórica"
        style={{
          display: 'grid',
          gap: '0.75rem',
          marginTop: '1rem',
          listStyle: 'none',
        }}
      >
        {score.criteria.map((criterion) => (
          <li
            key={criterion.id}
            style={{ minWidth: 0, overflowWrap: 'anywhere' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '0.25rem 0.75rem',
              }}
            >
              <strong>{criterion.title}</strong>
              <span>
                {criterion.points}/{criterion.maxPoints} pontos
              </span>
            </div>
            <progress
              aria-label={`${criterion.title}: ${criterion.points} de ${criterion.maxPoints} pontos`}
              max={criterion.maxPoints}
              value={criterion.points}
              style={{ width: '100%', marginTop: '0.35rem' }}
            />
            <p
              style={{
                marginTop: '0.25rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              {criterion.explanation}
            </p>
          </li>
        ))}
      </ul>

      <p
        style={{
          marginTop: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
          overflowWrap: 'anywhere',
        }}
      >
        {score.disclaimer}
      </p>
    </section>
  );
}
