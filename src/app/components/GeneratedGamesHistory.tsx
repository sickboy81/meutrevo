'use client';

import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';

type RecordItem = {
  id: string;
  lottery: string;
  selectedNumbers: number[];
  source: string;
  strategyId?: string;
  score: { total: number; label: string };
  analysisSnapshot: {
    cutoffContest: number;
    dataWindow: { drawsAnalyzed: number };
  };
  createdAt: string;
};

const sourceLabels: Record<string, string> = {
  smart_generator: 'Gerador inteligente',
  strategy: 'Estratégia',
  closure: 'Fechamento',
  bolao: 'Bolão',
  manual: 'Manual',
};

export default function GeneratedGamesHistory({
  lottery,
}: {
  lottery: string;
}) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithCsrf(
      `/api/generated-games?lottery=${encodeURIComponent(lottery)}&limit=20`
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || 'Não foi possível carregar o histórico.'
          );
        setItems(data.games || []);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar o histórico.'
        )
      )
      .finally(() => setLoading(false));
  }, [lottery]);

  return (
    <section
      className="glass-panel"
      style={{ marginTop: '1rem' }}
      aria-labelledby="generated-history-title"
    >
      <h3
        id="generated-history-title"
        style={{ color: 'var(--accent-color)', marginTop: 0 }}
      >
        HISTÓRICO DE GERAÇÕES
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Registro automático dos jogos gerados, separado de Meus Jogos. O score é
        aderência histórica, não previsão.
      </p>
      {loading && <p>Carregando histórico...</p>}
      {error && (
        <p role="alert" style={{ color: '#ff6b8a' }}>
          {error}
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>
          Nenhuma geração registrada para esta modalidade.
        </p>
      )}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              padding: '0.65rem',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                flexWrap: 'wrap',
                fontSize: '0.72rem',
              }}
            >
              <strong>{sourceLabels[item.source] || item.source}</strong>
              <span>
                Score {item.score.total}/100 · {item.score.label}
              </span>
            </div>
            <code style={{ display: 'block', marginTop: '0.35rem' }}>
              {item.selectedNumbers
                .map((number) => String(number).padStart(2, '0'))
                .join(' - ')}
            </code>
            <small style={{ color: 'var(--text-muted)' }}>
              Corte #{item.analysisSnapshot.cutoffContest} ·{' '}
              {item.analysisSnapshot.dataWindow.drawsAnalyzed} concursos
              analisados · {new Date(item.createdAt).toLocaleString('pt-BR')}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
