'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';

export type GeneratedGameHistoryItem = {
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
  smart_generator: 'Gerador por critérios',
  strategy: 'Estratégia da modalidade',
  closure: 'Fechamento',
  bolao: 'Bolão',
  manual: 'Manual',
};

export default function GeneratedGamesHistory({
  lottery,
  onRegenerate,
}: {
  lottery: string;
  onRegenerate?: (item: GeneratedGameHistoryItem) => void;
}) {
  const [items, setItems] = useState<GeneratedGameHistoryItem[]>([]);
  const [source, setSource] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSelected([]);
      setMessage('');
      setError('');
      setLoading(true);
      const query = new URLSearchParams({ lottery, limit: '50' });
      if (source) query.set('source', source);
      fetchWithCsrf(`/api/generated-games?${query.toString()}`)
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
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lottery, source]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.id)),
    [items, selected]
  );
  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : current.length < 3
          ? [...current, id]
          : current
    );

  const saveToMyGames = async (item: GeneratedGameHistoryItem) => {
    setBusyId(item.id);
    try {
      const response = await fetchWithCsrf('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lottery, numbers: item.selectedNumbers }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || 'Não foi possível salvar o jogo.');
      setMessage('Jogo salvo em Meus Jogos.');
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível salvar o jogo.'
      );
    } finally {
      setBusyId('');
    }
  };

  const remove = async (item: GeneratedGameHistoryItem) => {
    if (!window.confirm('Excluir este registro do histórico?')) return;
    setBusyId(item.id);
    try {
      const response = await fetchWithCsrf(
        `/api/generated-games?id=${encodeURIComponent(item.id)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Não foi possível excluir o registro.');
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSelected((current) => current.filter((id) => id !== item.id));
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível excluir o registro.'
      );
    } finally {
      setBusyId('');
    }
  };

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
        Registra as combinações geradas para você revisar. A pontuação é
        aderência histórica, não previsão.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.75rem',
        }}
      >
        <label style={{ fontSize: '0.7rem' }}>
          Filtrar estratégia
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {selectedItems.length > 1 && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              alignSelf: 'end',
            }}
          >
            Comparação: {selectedItems.length} jogos ·{' '}
            {selectedItems.reduce(
              (sum, item) => sum + item.selectedNumbers.length,
              0
            )}{' '}
            dezenas selecionadas
          </span>
        )}
      </div>
      {message && (
        <p role="status" style={{ color: '#00e676', fontSize: '0.72rem' }}>
          {message}
        </p>
      )}
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
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggleSelected(item.id)}
                />{' '}
                Comparar
              </label>
              <strong>{sourceLabels[item.source] || item.source}</strong>
              <span>
                Aderência {item.score.total}/100 · {item.score.label}
              </span>
            </div>
            <code style={{ display: 'block', marginTop: '0.35rem' }}>
              {item.selectedNumbers
                .map((number) => String(number).padStart(2, '0'))
                .join(' - ')}
            </code>
            <small style={{ color: 'var(--text-muted)' }}>
              Corte #{item.analysisSnapshot.cutoffContest} ·{' '}
              {item.analysisSnapshot.dataWindow.drawsAnalyzed} concursos ·{' '}
              {new Date(item.createdAt).toLocaleString('pt-BR')}
            </small>
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                flexWrap: 'wrap',
                marginTop: '0.55rem',
              }}
            >
              <button
                type="button"
                className="theme-pill-btn"
                onClick={() => void saveToMyGames(item)}
                disabled={busyId === item.id}
              >
                Salvar em Meus Jogos
              </button>
              <button
                type="button"
                className="theme-pill-btn"
                onClick={() => onRegenerate?.(item)}
              >
                Gerar novamente
              </button>
              <button
                type="button"
                className="theme-pill-btn"
                onClick={() => void remove(item)}
                disabled={busyId === item.id}
              >
                Excluir registro
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
