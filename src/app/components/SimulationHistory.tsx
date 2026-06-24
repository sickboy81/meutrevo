'use client';

import { useState, useEffect } from 'react';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';

interface Simulation {
  id: string;
  lottery: string;
  numbers: string;
  max_hits: number;
  hits_count: number;
  created_at: string;
}

export default function SimulationHistory() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filterLottery, setFilterLottery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (filterLottery) params.set('lottery', filterLottery);
          params.set('sort', sortOrder);
          const res = await fetch(`/api/simulations?${params}`);
          if (res.ok) {
            const data = await res.json();
            setSimulations(data.simulations || []);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [filterLottery, sortOrder]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSimulations((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div
      className="glass-panel"
      style={{ padding: '1.25rem', borderRadius: '16px' }}
    >
      <div className="panel-header" style={{ marginBottom: '1rem' }}>
        <div className="panel-title">📋 HISTÓRICO DE SIMULAÇÕES</div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <select
          value={filterLottery}
          onChange={(e) => setFilterLottery(e.target.value)}
          style={{
            padding: '0.4rem 0.75rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          <option value="">Todas as Loterias</option>
          {Object.values(LOTTERY_CONFIGS).map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
          }
          style={{
            padding: '0.4rem 0.75rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {sortOrder === 'desc' ? '↓ Mais Recente' : '↑ Mais Antigo'}
        </button>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
          }}
        >
          Carregando...
        </div>
      ) : simulations.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          Nenhuma simulação salva ainda. Vá até o simulador e salve seus jogos!
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {simulations.map((sim) => {
            const lotConfig = LOTTERY_CONFIGS[sim.lottery];
            const numbers = sim.numbers
              ? sim.numbers.split(',').map(Number)
              : [];
            return (
              <div
                key={sim.id}
                className="landing-feature-card"
                style={{
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: lotConfig?.color || '#666',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'white',
                      }}
                    >
                      {lotConfig?.name || sim.lottery}
                    </div>
                    <div
                      style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                    >
                      {numbers.length > 0 && numbers.join(' · ')}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#00e676',
                      fontWeight: 'bold',
                    }}
                  >
                    {sim.hits_count} acertos
                  </div>
                  <div
                    style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}
                  >
                    Max: {sim.max_hits}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                </div>
                <button
                  onClick={() => handleDelete(sim.id)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,23,68,0.3)',
                    color: '#ff1744',
                    borderRadius: '6px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                  }}
                >
                  Excluir
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
