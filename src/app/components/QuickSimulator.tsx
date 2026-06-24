'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  LOTTERY_CONFIGS,
  generateSmartGame,
  analyzeGame,
} from '../../lib/lottery-math';
import ScoreGauge from './ScoreGauge';
import QualityBreakdown from './QualityBreakdown';

interface LotteryResult {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  trevosSorteados?: string[];
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  nomeMunicipioUFSorteio?: string;
  localSorteio?: string;
  listaRateioPremio?: {
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
}

interface QuickSimulatorProps {
  initialResult: LotteryResult | null;
  initialLottery: string;
}

export default function QuickSimulator({
  initialResult,
  initialLottery,
}: QuickSimulatorProps) {
  const [activeLottery, setActiveLottery] = useState<string>(initialLottery);
  const [landingQuickNums, setLandingQuickNums] = useState<number[]>([]);
  const [landingQuickResult, setLandingQuickResult] = useState<string>('');
  const [result, setResult] = useState<LotteryResult | null>(initialResult);

  const config = LOTTERY_CONFIGS[activeLottery];

  // Fetch new result client-side if the active lottery changes
  useEffect(() => {
    if (activeLottery === initialLottery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(initialResult);
      return;
    }

    let active = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/loteria/${activeLottery}?limit=1`);
        if (res.ok && active) {
          const data = await res.json();
          const latest = data.latest || data;
          setResult(latest);
        }
      } catch (err) {
        console.error(err);
      }
    };
    void fetchLatest();
    return () => {
      active = false;
    };
  }, [activeLottery, initialLottery, initialResult]);

  // Real-time analysis for landing quick test board
  const landingQuickStats = useMemo(() => {
    if (landingQuickNums.length === 0) {
      return { sum: 0, even: 0, odd: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
    }
    const sum = landingQuickNums.reduce((a, b) => a + b, 0);
    const even = landingQuickNums.filter((n) => n % 2 === 0).length;
    const odd = landingQuickNums.length - even;

    // Calculate quadrantes based on config
    let q1 = 0,
      q2 = 0,
      q3 = 0,
      q4 = 0;
    if (config) {
      const midVal =
        config.minNum + Math.floor((config.maxNum - config.minNum + 1) / 2);
      landingQuickNums.forEach((n) => {
        const isLeft = n % 10 >= 1 && n % 10 <= 5;
        const isTop = n < midVal;
        if (isTop && isLeft) q1++;
        else if (isTop && !isLeft) q2++;
        else if (!isTop && isLeft) q3++;
        else q4++;
      });
    }
    return { sum, even, odd, q1, q2, q3, q4 };
  }, [landingQuickNums, config]);

  const gameMetrics = useMemo(() => {
    if (landingQuickNums.length === 0 || !config) return null;
    return analyzeGame(landingQuickNums, config, []);
  }, [landingQuickNums, config]);

  const getCleanDezenas = (lotResult: LotteryResult) => {
    const list =
      lotResult.listaDezenas || lotResult.dezenasSorteadasOrdemSorteio || [];
    if (activeLottery === 'supersete') {
      return list;
    }
    return [...list]
      .map((x) => parseInt(x, 10))
      .sort((a, b) => a - b)
      .map((x) => String(x).padStart(2, '0'));
  };

  const handleToggleLandingNum = (num: number) => {
    const maxSel = config?.drawCount || 6;
    if (landingQuickNums.includes(num)) {
      setLandingQuickNums((prev) => prev.filter((x) => x !== num));
      setLandingQuickResult('');
    } else {
      if (landingQuickNums.length >= maxSel) {
        return;
      }
      setLandingQuickNums((prev) => [...prev, num]);
      setLandingQuickResult('');
    }
  };

  const handleTestLandingGame = () => {
    if (!result) return;
    const cleanDrawn = getCleanDezenas(result).map((x) => parseInt(x, 10));
    const hits = landingQuickNums.filter((n) => cleanDrawn.includes(n));

    let message = '';
    if (landingQuickNums.length === 0) {
      message = 'Selecione dezenas no volante acima para testar!';
    } else {
      message = `Você marcou ${landingQuickNums.length} números e acertou ${hits.length} no Concurso ${result.numero} (${
        hits.length > 0
          ? hits
              .sort((a, b) => a - b)
              .map((x) => String(x).padStart(2, '0'))
              .join(', ')
          : 'Nenhum'
      }). Quer testar contra todo o histórico de sorteios da Caixa? Inicie no app!`;
    }
    setLandingQuickResult(message);
  };

  const handleGenerateLandingSmart = () => {
    const game = generateSmartGame(config, [], [], 'balanced', [], [], [], {});
    setLandingQuickNums(game.numbers);
    setLandingQuickResult(
      'Jogo preenchido automaticamente com base nos filtros atuais. Clique em "Testar jogo" para comparar com o último concurso.'
    );
  };

  return (
    <section
      className="landing-widget-card glass-panel"
      style={{
        borderRadius: '24px',
        margin: '0 1.25rem 2rem 1.25rem',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
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
          }}
        >
          <span style={{ color: 'var(--accent-color)' }}>🎮</span> TESTE SUA
          APOSTA ANTES DE JOGAR
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
            lineHeight: 1.4,
          }}
        >
          Escolha dezenas e veja na hora soma, par/ímpar, quadrantes e
          comparação com o último concurso.
        </p>
      </div>

      <div className="landing-widget-layout">
        {/* Left Side: Volante Virtual */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div
            className="landing-widget-tabs"
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '0.2rem',
              borderRadius: '8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.15rem',
            }}
          >
            {Object.values(LOTTERY_CONFIGS).map((lot) => (
              <button
                key={lot.id}
                className={`landing-widget-tab-btn ${activeLottery === lot.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveLottery(lot.id);
                  setLandingQuickNums([]);
                  setLandingQuickResult('');
                }}
                style={
                  {
                    '--active-color': lot.color,
                    '--active-glow': lot.accentColor,
                    fontSize: '0.65rem',
                    padding: '0.3rem 0.5rem',
                    whiteSpace: 'nowrap',
                  } as React.CSSProperties
                }
              >
                {lot.name} ({lot.maxNum})
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 0.2rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Selecionados:{' '}
              <strong
                style={{ color: 'white', fontFamily: 'var(--font-body)' }}
              >
                {landingQuickNums.length}
              </strong>{' '}
              / {config?.drawCount || 6}
            </span>
            <button
              onClick={() => {
                setLandingQuickNums([]);
                setLandingQuickResult('');
              }}
              className="landing-inline-action"
              type="button"
            >
              Limpar Volante
            </button>
          </div>

          {/* Board Grid */}
          <div
            className={`landing-board-grid ${config && config.maxNum <= 30 ? 'lotofacil' : ''}`}
            style={{
              background: 'rgba(0,0,0,0.15)',
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            {Array.from({
              length: (config?.maxNum || 60) - (config?.minNum || 1) + 1,
            }).map((_, index) => {
              const num = index + 1;
              const isSelected = landingQuickNums.includes(num);
              return (
                <button
                  key={num}
                  className={`landing-board-ball ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleLandingNum(num)}
                  type="button"
                  aria-pressed={isSelected}
                  style={
                    {
                      '--active-color': config.color,
                      '--active-glow': config.accentColor,
                    } as React.CSSProperties
                  }
                >
                  {String(num).padStart(2, '0')}
                </button>
              );
            })}
          </div>

          <div
            className="landing-widget-actions"
            style={{ marginTop: '0.5rem' }}
          >
            <button
              className="theme-pill-btn"
              onClick={handleGenerateLandingSmart}
              type="button"
              style={{
                flex: 1,
                minHeight: '52px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.82rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              🎲 Gerar jogo rápido
            </button>
            <button
              className="btn-action"
              onClick={handleTestLandingGame}
              type="button"
              style={
                {
                  flex: 1.2,
                  minHeight: '52px',
                  padding: '0.75rem 0.9rem',
                  fontSize: '0.82rem',
                  '--accent-glow': config.accentColor,
                  borderRadius: '10px',
                } as React.CSSProperties
              }
            >
              📊 Testar jogo
            </button>
          </div>
        </div>

        {/* Right Side: Real-time Analysis Panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            padding: '1rem',
            borderRadius: '16px',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '0.35rem',
              }}
            >
              📊 ANÁLISE DO JOGO
            </h4>

            {gameMetrics && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}
              >
                <ScoreGauge score={gameMetrics.score} size={64} />
                <QualityBreakdown metrics={gameMetrics} config={config} />
              </div>
            )}

            {landingQuickNums.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '160px',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>
                  💡 Selecione números no volante para ativar as estatísticas
                  dinâmicas em tempo real.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Sum Widget */}
                <div className="stat-tag-badge">
                  <span
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}
                  >
                    Soma Total:
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: 'white',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {landingQuickStats.sum}
                    </span>
                    {config && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          padding: '0.1rem 0.3rem',
                          borderRadius: '4px',
                          background:
                            landingQuickStats.sum >= config.expectedSumMin &&
                            landingQuickStats.sum <= config.expectedSumMax
                              ? 'rgba(0, 230, 118, 0.15)'
                              : 'rgba(255, 23, 68, 0.15)',
                          color:
                            landingQuickStats.sum >= config.expectedSumMin &&
                            landingQuickStats.sum <= config.expectedSumMax
                              ? '#00e676'
                              : '#ff1744',
                        }}
                      >
                        {landingQuickStats.sum >= config.expectedSumMin &&
                        landingQuickStats.sum <= config.expectedSumMax
                          ? 'Ideal'
                          : 'Fora da Média'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Even/Odd Widget */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span>
                      Pares: <strong>{landingQuickStats.even}</strong>
                    </span>
                    <span>
                      Ímpares: <strong>{landingQuickStats.odd}</strong>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        width: `${(landingQuickStats.even / landingQuickNums.length) * 100}%`,
                        background: 'var(--accent-color)',
                        height: '100%',
                      }}
                    ></div>
                    <div
                      style={{
                        width: `${(landingQuickStats.odd / landingQuickNums.length) * 100}%`,
                        background: '#ff007f',
                        height: '100%',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Quadrants Widget */}
                {config && config.maxNum >= 10 && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Quadrantes (Q1 | Q2 | Q3 | Q4):
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.25rem',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                        }}
                      >
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.55rem',
                          }}
                        >
                          Q1
                        </div>
                        <strong style={{ color: 'white' }}>
                          {landingQuickStats.q1}
                        </strong>
                      </div>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                        }}
                      >
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.55rem',
                          }}
                        >
                          Q2
                        </div>
                        <strong style={{ color: 'white' }}>
                          {landingQuickStats.q2}
                        </strong>
                      </div>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                        }}
                      >
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.55rem',
                          }}
                        >
                          Q3
                        </div>
                        <strong style={{ color: 'white' }}>
                          {landingQuickStats.q3}
                        </strong>
                      </div>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                        }}
                      >
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.55rem',
                          }}
                        >
                          Q4
                        </div>
                        <strong style={{ color: 'white' }}>
                          {landingQuickStats.q4}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test results dynamic feedback */}
          {landingQuickResult && (
            <div
              className="glass-panel"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderLeft: `4px solid ${config.color}`,
                padding: '0.8rem',
                borderRadius: '8px',
                boxShadow: `0 0 10px ${config.accentColor}`,
                animation: 'fade-in 0.25s ease',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.5,
                }}
              >
                {landingQuickResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
