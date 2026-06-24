'use client';

import React, { useMemo, useRef } from 'react';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';
import type { LotteryResult } from '../types';

interface StatsTabProps {
  isPro: boolean;
  playSound: (type: 'click' | 'success' | 'delete') => void;
  setShowUpgradeModal: (show: boolean) => void;
  statsData: {
    frequencyMap: Record<number, number>;
    hotNumbers: { num: number; count: number }[];
    coldNumbers: { num: number; delay: number }[];
    avgSum: number;
    evenPct: number;
    delays?: Record<number, number>;
    topPairs?: { pair: string; count: number }[];
    rangeDistribution?: { low: number; mid: number; high: number };
    consecPct?: number;
    topByPosition?: {
      position: number;
      top: { num: number; count: number }[];
    }[];
    topTriads?: { nums: number[]; count: number }[];
    topQuads?: { nums: number[]; count: number }[];
    monthlyAnalysis?: {
      month: string;
      draws: number;
      avgSum: number;
      evenPct: number;
    }[];
    sequenceDistribution?: { length: number; count: number }[];
  };
  activeLottery: string;
  history: LotteryResult[];
}

function getHeatmapColor(count: number, maxCount: number): string {
  if (maxCount === 0) return 'rgba(255, 255, 255, 0.04)';
  const intensity = count / maxCount;
  if (intensity > 0.75) return 'rgba(0, 230, 118, 0.35)';
  if (intensity > 0.5) return 'rgba(0, 230, 118, 0.2)';
  if (intensity > 0.25) return 'rgba(255, 214, 0, 0.15)';
  return 'rgba(255, 68, 102, 0.1)';
}

export default React.memo(function StatsTab({
  statsData,
  activeLottery,
  history,
  isPro,
  playSound,
  setShowUpgradeModal,
}: StatsTabProps) {
  const {
    frequencyMap,
    hotNumbers,
    coldNumbers,
    avgSum,
    evenPct,
    topPairs,
    rangeDistribution,
    consecPct,
    topByPosition,
    topTriads,
    topQuads,
    monthlyAnalysis,
    sequenceDistribution,
  } = statsData;
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  const config = LOTTERY_CONFIGS[activeLottery as keyof typeof LOTTERY_CONFIGS];

  const maxCount = useMemo(() => {
    const counts = Object.values(frequencyMap);
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [frequencyMap]);

  if (!isPro) {
    return (
      <div
        className="profile-card animate-fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          textAlign: 'center',
          padding: '3rem 1rem',
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>📊</div>
        <h2
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: 'white',
            marginBottom: '0.5rem',
          }}
        >
          Estatísticas Avançadas PRO
        </h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            maxWidth: '400px',
          }}
        >
          Desbloqueie dados completos sobre números quentes, atrasados e padrões
          dos sorteios. Esses dados ajudam a tomar decisões mais informadas.
        </p>
        <button
          className="btn-action"
          onClick={() => {
            playSound?.('click');
            setShowUpgradeModal(true);
          }}
          style={{
            background: 'linear-gradient(90deg, #ff007f, #ffd600)',
            color: 'black',
            fontWeight: 'bold',
            padding: '0.75rem 2rem',
          }}
        >
          ⚡ Assinar PRO
        </button>
      </div>
    );
  }

  const total =
    hotNumbers.reduce((s, h) => s + h.count, 0) +
      coldNumbers.reduce((s, c) => s + c.delay, 0) || 1;

  return (
    <div
      className="profile-card animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <div>
        <h2
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
          📊 ESTATÍSTICAS
        </h2>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.2rem',
            margin: 0,
          }}
        >
          Análise dos últimos {history.length} concursos da{' '}
          {config?.name || activeLottery}.
        </p>
      </div>

      {/* Explicação Geral */}
      <div
        style={{
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          padding: '0.6rem',
          borderRadius: '8px',
          background: 'rgba(0,240,255,0.03)',
          border: '1px solid rgba(0,240,255,0.08)',
        }}
      >
        <strong style={{ color: 'white' }}>Como interpretar:</strong> Estas
        estatísticas são baseadas em dados reais de sorteios passados. Números{' '}
        <strong style={{ color: '#00e676' }}>quentes</strong> saíram mais vezes
        recentemente. Números{' '}
        <strong style={{ color: '#ff4466' }}>frios</strong> estão
        &quot;atrasados&quot; - não saem há mais tempo.
        <br />
        <br />
        ⚠️ <strong style={{ color: '#ffd600' }}>Importante:</strong> Sorteios
        passados <em>não</em> influenciam resultados futuros. Cada sorteio é
        independente. Estas estatísticas servem para <em>entender padrões</em>,
        não para <em>prever resultados</em>.
      </div>

      {/* Resumo */}
      <div
        style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '0.75rem',
        }}
      >
        <h4
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 0.5rem 0',
          }}
        >
          Resumo Geral
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(0,240,255,0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(0,240,255,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                marginBottom: '0.2rem',
              }}
            >
              Concursos
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'white',
                fontFamily: 'var(--font-numbers)',
              }}
            >
              {history.length}
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(255,214,0,0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(255,214,0,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                marginBottom: '0.2rem',
              }}
            >
              Soma Média
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'white',
                fontFamily: 'var(--font-numbers)',
              }}
            >
              {avgSum}
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: '0.5rem',
              background: 'rgba(147,9,143,0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(147,9,143,0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.55rem',
                color: 'var(--text-muted)',
                marginBottom: '0.2rem',
              }}
            >
              % Pares
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'white',
                fontFamily: 'var(--font-numbers)',
              }}
            >
              {evenPct}%
            </div>
          </div>
          {consecPct !== undefined && (
            <div
              style={{
                textAlign: 'center',
                padding: '0.5rem',
                background: 'rgba(255,109,0,0.04)',
                borderRadius: '8px',
                border: '1px solid rgba(255,109,0,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                % Consecutivos
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                {consecPct}%
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: '0.5rem',
            color: 'var(--text-muted)',
            marginTop: '0.4rem',
            lineHeight: 1.4,
          }}
        >
          <strong>Soma Média:</strong> Média da soma dos números sorteados. Para
          Mega-Sena (6 de 60), o esperado é ~
          {config
            ? Math.round((config.drawCount * (config.maxNum + 1)) / 2)
            : 183}
          .<br />
          <strong>% Pares:</strong> Porcentagem de números pares nos sorteios. O
          ideal para equilíbrio é ~50%.
          <br />
          <strong>% Consecutivos:</strong> % de sorteios que pelo menos 1 par de
          números consecutivos (ex: 23 e 24).
        </div>
      </div>

      {/* Números Quentes e Frios lado a lado */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
        }}
      >
        {/* Quentes */}
        <div
          style={{
            background: 'rgba(0,230,118,0.03)',
            border: '1px solid rgba(0,230,118,0.12)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#00e676',
              margin: '0 0 0.4rem 0',
            }}
          >
            🔥 Números Quentes
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Saíram mais vezes nos últimos sorteios. Muitas pessoas apostam neles
            porque &quot;estão na moda&quot;.
          </div>
          {hotNumbers.map(({ num, count }) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div
                key={num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.35rem',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: `${config?.color || '#00ff88'}20`,
                    border: `1px solid ${config?.color || '#00ff88'}`,
                    color: 'white',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {String(num).padStart(2, '0')}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(pct * 2, 100)}%`,
                        height: '100%',
                        background: '#00e676',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: '#00e676',
                    fontWeight: '600',
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {count}x
                </span>
              </div>
            );
          })}
        </div>

        {/* Frios */}
        <div
          style={{
            background: 'rgba(255,68,102,0.03)',
            border: '1px solid rgba(255,68,102,0.12)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#ff4466',
              margin: '0 0 0.4rem 0',
            }}
          >
            ❄️ Números Frios
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Não saem há mais tempo (&quot;atrasados&quot;). Alguns apostadores
            acreditam que &quot;devem sair em breve&quot;.
          </div>
          {coldNumbers.map(({ num, delay }) => (
            <div
              key={num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.35rem',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,68,102,0.15)',
                  border: '1px solid rgba(255,68,102,0.4)',
                  color: 'white',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                {String(num).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min((delay / 20) * 100, 100)}%`,
                      height: '100%',
                      background: '#ff4466',
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: '#ff4466',
                  fontWeight: '600',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                {delay}x
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição por Faixa */}
      {rangeDistribution && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            📊 Distribuição por Faixa
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Como os números se distribuem entre baixos, médios e altos.
            Idealmente seria ~33% cada (uniforme).
          </div>
          <div
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}
          >
            {[
              {
                label: `Baixos (1-${Math.ceil((config?.maxNum || 60) / 3)})`,
                pct: rangeDistribution.low,
                color: '#00f0ff',
              },
              {
                label: `Médios (${Math.ceil((config?.maxNum || 60) / 3) + 1}-${Math.ceil(((config?.maxNum || 60) / 3) * 2)})`,
                pct: rangeDistribution.mid,
                color: '#ffd600',
              },
              {
                label: `Altos (${Math.ceil(((config?.maxNum || 60) / 3) * 2) + 1}-${config?.maxNum || 60})`,
                pct: rangeDistribution.high,
                color: '#ff007f',
              },
            ].map((r) => (
              <div key={r.label} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: `${Math.max(r.pct * 2, 4)}px`,
                    borderRadius: '4px',
                    background: `${r.color}25`,
                    border: `1px solid ${r.color}30`,
                    marginBottom: '0.3rem',
                    transition: 'height 0.3s',
                  }}
                />
                <div
                  style={{
                    fontSize: '0.55rem',
                    color: r.color,
                    fontWeight: 700,
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  {r.pct}%
                </div>
                <div
                  style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}
                >
                  {r.label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: '0.5rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            Se uma faixa tem mais de 40%, os sorteios estão{' '}
            <em>tendenciados</em> para essa região. Se estão próximos de 33%
            cada, a distribuição é <em>uniforme</em>.
          </div>
        </div>
      )}

      {/* Pares que Mais Aparecem Juntos */}
      {topPairs && topPairs.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            🔗 Pares que Mais Aparecem Juntos
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Números que foram sorteados juntos com mais frequência. Alguns
            apostadores usam esses pares para montar jogos.
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.4rem',
            }}
          >
            {topPairs.map(({ pair, count }) => {
              const [a, b] = pair.split('-');
              return (
                <div
                  key={pair}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: `${config?.color || '#00ff88'}22`,
                      border: `1px solid ${config?.color || '#00ff88'}`,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {a}
                  </span>
                  <span
                    style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}
                  >
                    +
                  </span>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: `${config?.color || '#00ff88'}22`,
                      border: `1px solid ${config?.color || '#00ff88'}`,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {b}
                  </span>
                  <span
                    style={{
                      fontSize: '0.5rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {count}x
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div
        className="heatmap-container"
        ref={heatmapContainerRef}
        style={{ overflow: 'auto', paddingBottom: '0.5rem' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            position: 'sticky',
            top: 0,
            background: 'rgba(15, 23, 35, 0.95)',
            zIndex: 10,
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'white',
              margin: 0,
            }}
          >
            🔥 Mapa de Calor
          </h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.6rem',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                color: '#ff4466',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(255,68,102,0.1)',
                }}
              />
              Frio
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                color: '#ffd600',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(255,214,0,0.15)',
                }}
              />
              Neutro
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                color: '#00e676',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: 'rgba(0,230,118,0.35)',
                }}
              />
              Quente
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(config?.maxNum || 10, 10)}, 1fr)`,
            gap: '0.4rem',
          }}
        >
          {Array.from({ length: config?.maxNum || 10 }, (_, i) => i + 1).map(
            (num) => {
              const count = frequencyMap[num] || 0;
              const color = getHeatmapColor(count, maxCount);
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div
                  key={num}
                  className="heatmap-cell"
                  style={{
                    background: color,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${pct}%`,
                      background: color,
                      borderRadius: '0 0 8px 8px',
                      transition: 'height 0.3s ease',
                      zIndex: -1,
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      fontWeight: '700',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {String(num).padStart(2, '0')}
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      color: 'var(--text-muted)',
                      fontSize: '0.6rem',
                      marginTop: '0.1rem',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {count}x
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Frequência por Posição */}
      {topByPosition && topByPosition.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            📍 Números Mais Frequentes por Posição
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Mostra quais números mais saíram em cada posição do sorteio (1º
            número, 2º número, etc.).
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '0.4rem',
            }}
          >
            {topByPosition
              .slice(0, Math.min(config?.drawCount || 6, 10))
              .map(({ position, top }) => (
                <div
                  key={position}
                  style={{
                    padding: '0.4rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.55rem',
                      color: 'var(--accent-color)',
                      fontWeight: 700,
                      marginBottom: '0.25rem',
                    }}
                  >
                    {position}ª Posição
                  </div>
                  {top.map(({ num, count }) => (
                    <div
                      key={num}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginBottom: '0.15rem',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: `${config?.color || '#00ff88'}22`,
                          border: `1px solid ${config?.color || '#00ff88'}`,
                          fontSize: '0.5rem',
                          fontWeight: 700,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-numbers)',
                        }}
                      >
                        {String(num).padStart(2, '0')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.5rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-numbers)',
                        }}
                      >
                        {count}x
                      </span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Trincas e Quadras */}
      {topTriads && topTriads.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            🔗 Trincas e Quadras Mais Frequentes
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Grupos de 3 e 4 números que mais saíram juntos nos sorteios.
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.6rem',
                color: '#ffd600',
                fontWeight: 600,
                marginBottom: '0.3rem',
              }}
            >
              Trincas (3 números)
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.3rem',
              }}
            >
              {topTriads.map(({ nums, count }) => (
                <div
                  key={nums.join('-')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.3rem',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {nums.map((n) => (
                    <span
                      key={n}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: `${config?.color || '#00ff88'}22`,
                        border: `1px solid ${config?.color || '#00ff88'}`,
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-numbers)',
                      }}
                    >
                      {String(n).padStart(2, '0')}
                    </span>
                  ))}
                  <span
                    style={{
                      fontSize: '0.45rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
          {topQuads && topQuads.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: '#ff007f',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                }}
              >
                Quadras (4 números)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.3rem',
                }}
              >
                {topQuads.map(({ nums, count }) => (
                  <div
                    key={nums.join('-')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: '0.3rem',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    {nums.map((n) => (
                      <span
                        key={n}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: `${config?.color || '#00ff88'}22`,
                          border: `1px solid ${config?.color || '#00ff88'}`,
                          fontSize: '0.5rem',
                          fontWeight: 700,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-numbers)',
                        }}
                      >
                        {String(n).padStart(2, '0')}
                      </span>
                    ))}
                    <span
                      style={{
                        fontSize: '0.45rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-numbers)',
                      }}
                    >
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Análise Mensal */}
      {monthlyAnalysis && monthlyAnalysis.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            📅 Padrões Mensais
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Como as estatísticas variam mês a mês. Se um mês tem soma média mais
            alta, os números tendem a ser maiores.
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
          >
            {monthlyAnalysis.map((m) => {
              const monthLabel = [
                '',
                'Jan',
                'Fev',
                'Mar',
                'Abr',
                'Mai',
                'Jun',
                'Jul',
                'Ago',
                'Set',
                'Out',
                'Nov',
                'Dez',
              ][parseInt(m.month.split('-')[1])];
              return (
                <div
                  key={m.month}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'white',
                      fontWeight: 600,
                      minWidth: '45px',
                    }}
                  >
                    {monthLabel} {m.month.split('-')[0].slice(2)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.5rem',
                      color: 'var(--text-muted)',
                      flex: 1,
                    }}
                  >
                    {m.draws} concursos
                  </span>
                  <span
                    style={{
                      fontSize: '0.5rem',
                      color: '#ffd600',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    Soma: {m.avgSum}
                  </span>
                  <span
                    style={{
                      fontSize: '0.5rem',
                      color:
                        m.evenPct > 55
                          ? '#00e676'
                          : m.evenPct < 45
                            ? '#ff4466'
                            : 'var(--text-muted)',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {m.evenPct}% pares
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Distribuição de Sequências */}
      {sequenceDistribution && sequenceDistribution.length > 0 && (
        <div
          style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '0.75rem',
          }}
        >
          <h4
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              margin: '0 0 0.4rem 0',
            }}
          >
            🔢 Distribuição de Sequências
          </h4>
          <div
            style={{
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              lineHeight: 1.5,
            }}
          >
            Qual a maior sequência consecutiva que aparece nos sorteios. Ex: se
            &quot;3&quot; aparece muito, significa que trincas consecutivas (ex:
            12-13-14) são comuns.
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {sequenceDistribution.map((s) => {
              const total = sequenceDistribution.reduce(
                (sum, item) => sum + item.count,
                0
              );
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div
                  key={s.length}
                  style={{
                    textAlign: 'center',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    minWidth: '60px',
                  }}
                >
                  <div
                    style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}
                  >
                    {s.length} {s.length === 1 ? 'seq.' : 'seq.'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'white',
                      fontFamily: 'var(--font-numbers)',
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
