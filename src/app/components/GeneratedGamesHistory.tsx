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
  onStartGenerating,
}: {
  lottery: string;
  onRegenerate?: (item: GeneratedGameHistoryItem) => void;
  onStartGenerating?: () => void;
}) {
  const [items, setItems] = useState<GeneratedGameHistoryItem[]>([]);
  const [source, setSource] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

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
  }, [lottery, source, reloadToken]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.id)),
    [items, selected]
  );
  const comparison = useMemo(() => {
    if (selectedItems.length < 2) return null;
    const first = selectedItems[0].selectedNumbers;
    const common = first.filter((number) =>
      selectedItems.every((item) => item.selectedNumbers.includes(number))
    );
    const union = new Set(
      selectedItems.flatMap((item) => item.selectedNumbers)
    );
    return {
      common,
      unique: union.size,
    };
  }, [selectedItems]);
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
        {comparison && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              alignSelf: 'end',
            }}
          >
            {selectedItems.length} jogos · {comparison.unique} dezenas
            diferentes · {comparison.common.length} em comum
          </span>
        )}
      </div>
      {comparison && (
        <div
          role="status"
          style={{
            marginBottom: '0.75rem',
            padding: '0.65rem',
            borderRadius: 8,
            background: 'rgba(0, 229, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.18)',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
          }}
        >
          <strong style={{ color: 'white' }}>
            Comparação dos jogos selecionados
          </strong>
          <br />
          Dezenas presentes em todos:{' '}
          {comparison.common.length > 0
            ? comparison.common
                .map((number) => String(number).padStart(2, '0'))
                .join(', ')
            : 'nenhuma'}
          . Isso mostra repetição entre combinações, não aumento de
          probabilidade.
        </div>
      )}
      {message && (
        <p role="status" style={{ color: '#00e676', fontSize: '0.72rem' }}>
          {message}
        </p>
      )}
      {loading && <p>Carregando histórico...</p>}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            color: '#ff9db1',
            fontSize: '0.75rem',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            className="theme-pill-btn"
            onClick={() => setReloadToken((current) => current + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div
          style={{
            border: '1px dashed rgba(0,240,255,0.2)',
            borderRadius: 8,
            padding: '0.8rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          <p style={{ marginTop: 0 }}>
            Nenhuma geração registrada para esta modalidade.
          </p>
          {onStartGenerating && (
            <button
              type="button"
              className="theme-pill-btn active"
              onClick={onStartGenerating}
            >
              Gerar um jogo agora
            </button>
          )}
        </div>
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
                  aria-label={`Comparar jogo ${item.selectedNumbers.join(', ')}`}
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
