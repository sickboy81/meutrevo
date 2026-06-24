'use client';

import React, { useState } from 'react';
import {
  getDesdobramentos,
  getLotteryGameCost,
  generateClosureGames,
  type Desdobramento,
} from '../../lib/desdobramentos';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';

interface Props {
  activeLottery: string;
  onGamesGenerated?: (games: number[][]) => void;
}

export default function DesdobramentosPanel({
  activeLottery,
  onGamesGenerated,
}: Props) {
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [selectedClosure, setSelectedClosure] = useState<Desdobramento | null>(
    null
  );

  const closures = getDesdobramentos(activeLottery);
  const config = LOTTERY_CONFIGS[activeLottery as keyof typeof LOTTERY_CONFIGS];
  const maxPick = config?.maxNum || 60;

  const toggleNum = (num: number) => {
    setSelectedNums((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
    setGeneratedGames([]);
    setSelectedClosure(null);
  };

  const handleGenerate = () => {
    if (!selectedClosure || selectedNums.length < selectedClosure.picks) return;
    const games = generateClosureGames(selectedNums, selectedClosure);
    setGeneratedGames(games);
    onGamesGenerated?.(games);
  };

  const cost = selectedClosure
    ? getLotteryGameCost(activeLottery, selectedClosure.games)
    : 0;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '0.75rem',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
          }}
        >
          <span>🔐</span> DESDOBRAMENTOS / FECHAMENTOS
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          Escolha seus números e selecione o fechamento. Garantia matemática de
          acerto mínimo.
        </p>
      </div>

      {/* Number board */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Selecionados:{' '}
            <strong style={{ color: 'white' }}>{selectedNums.length}</strong>
          </span>
          <button
            onClick={() => {
              setSelectedNums([]);
              setGeneratedGames([]);
              setSelectedClosure(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff1744',
              fontSize: '0.7rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Limpar
          </button>
        </div>
        <div
          className={`landing-board-grid ${activeLottery === 'lotofacil' ? 'lotofacil' : ''}`}
          style={{
            background: 'rgba(0,0,0,0.15)',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          {Array.from({ length: maxPick }).map((_, idx) => {
            const num = idx + 1;
            const isSelected = selectedNums.includes(num);
            return (
              <button
                key={num}
                onClick={() => toggleNum(num)}
                style={{
                  height: activeLottery === 'lotofacil' ? '36px' : '30px',
                  borderRadius: '6px',
                  border: `1px solid ${isSelected ? config?.color || '#00ff88' : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected
                    ? `${config?.color || '#00ff88'}22`
                    : 'rgba(0,0,0,0.2)',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? `0 0 8px ${config?.accentColor || '#00ff88'}`
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Closure selection */}
      {closures.length > 0 &&
        (() => {
          const minPicks = Math.min(...closures.map((c) => c.picks));
          const hasEnough = selectedNums.length >= minPicks;

          if (selectedNums.length < Math.min(7, minPicks)) return null;

          return (
            <div>
              <h4
                style={{
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}
              >
                Selecione o Fechamento:
              </h4>

              {!hasEnough && selectedNums.length > 0 && (
                <div
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    background: 'rgba(255,214,0,0.05)',
                    border: '1px solid rgba(255,214,0,0.15)',
                    fontSize: '0.7rem',
                    color: '#ffd600',
                  }}
                >
                  Selecione pelo menos <strong>{minPicks}</strong> dezenas
                  (atual: {selectedNums.length}). O fechamento exige mais
                  números que o sorteio ({config?.drawCount || '?'} dezenas).
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  maxHeight: '250px',
                  overflowY: 'auto',
                }}
              >
                {closures.map((c) => {
                  const canUse = selectedNums.length >= c.picks;
                  const isSelected =
                    selectedClosure !== null && selectedClosure.id === c.id;
                  const cCost = getLotteryGameCost(activeLottery, c.games);
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (canUse) {
                          setSelectedClosure(c);
                          setGeneratedGames([]);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem',
                        background: isSelected
                          ? 'rgba(0,240,255,0.08)'
                          : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'rgba(0,240,255,0.3)' : canUse ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
                        borderRadius: '8px',
                        cursor: canUse ? 'pointer' : 'default',
                        opacity: canUse ? 1 : 0.35,
                        color: 'white',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {c.name} ({c.picks} dezenas)
                        </div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {c.games} jogos · {c.guarantee}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: canUse ? '#00f0ff' : 'var(--text-muted)',
                          }}
                        >
                          {c.games} jogos
                        </div>
                        <div
                          style={{
                            fontSize: '0.6rem',
                            color: canUse
                              ? '#ff4466'
                              : 'rgba(255,255,255,0.15)',
                          }}
                        >
                          R$ {cCost.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* Generate button */}
      {selectedClosure && selectedNums.length >= selectedClosure.picks && (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'white',
              background: 'rgba(0,0,0,0.2)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
            }}
          >
            <span>
              Total: <strong>{selectedClosure.games} jogos</strong>
            </span>
            <span>
              Custo:{' '}
              <strong style={{ color: '#ff4466' }}>
                R$ {cost.toFixed(2).replace('.', ',')}
              </strong>
            </span>
          </div>
          <button
            onClick={handleGenerate}
            className="btn-action"
            style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            🔐 Gerar {selectedClosure.games} Jogos
          </button>
        </div>
      )}

      {/* Generated games */}
      {generatedGames.length > 0 && (
        <div
          style={{
            background: 'rgba(0,230,118,0.03)',
            border: '1px solid rgba(0,230,118,0.15)',
            borderRadius: '10px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              color: '#00e676',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            ✓ {generatedGames.length} jogos gerados com garantia
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {generatedGames.map((game, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)', minWidth: '20px' }}>
                  #{idx + 1}
                </span>
                <div
                  style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}
                >
                  {game.map((n, ni) => (
                    <span
                      key={ni}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: `${config?.color || '#00ff88'}33`,
                        border: `1px solid ${config?.color || '#00ff88'}`,
                        color: 'white',
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {String(n).padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const text = generatedGames
                .map(
                  (g, i) =>
                    `#${i + 1}: ${g.map((n) => String(n).padStart(2, '0')).join(' - ')}`
                )
                .join('\n');
              navigator.clipboard.writeText(text);
            }}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'rgba(0,240,255,0.1)',
              border: '1px solid rgba(0,240,255,0.2)',
              color: 'var(--accent-color)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Copiar todos os jogos
          </button>
        </div>
      )}
    </div>
  );
}
