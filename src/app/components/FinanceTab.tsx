'use client';

import React from 'react';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';
import { fetchWithCsrf } from '@/lib/fetch';
import type { BetRecord, LotteryResult } from '../types';

interface FinanceTabProps {
  isPro: boolean;
  playSound: (type: 'click' | 'success' | 'delete') => void;
  setShowUpgradeModal: (show: boolean) => void;
  bets: BetRecord[];
  setBets: React.Dispatch<React.SetStateAction<BetRecord[]>>;
  betsLoading: boolean;
  setBetsLoading: (loading: boolean) => void;
  betForm: {
    lottery: string;
    numbers: string;
    contest_num: string;
    cost: string;
    prize_won: string;
  };
  setBetForm: React.Dispatch<
    React.SetStateAction<{
      lottery: string;
      numbers: string;
      contest_num: string;
      cost: string;
      prize_won: string;
    }>
  >;
  betFeedback: string;
  setBetFeedback: (feedback: string) => void;
  betFormLoading: boolean;
  setBetFormLoading: (loading: boolean) => void;
  financeFilter: string;
  setFinanceFilter: (filter: string) => void;
  handleExportCSV: () => void;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split('-');
  const months = [
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
  ];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default React.memo(function FinanceTab({
  isPro,
  playSound,
  setShowUpgradeModal,
  bets,
  setBets,
  betsLoading,
  setBetsLoading,
  betForm,
  setBetForm,
  betFeedback,
  setBetFeedback,
  betFormLoading,
  setBetFormLoading,
  financeFilter,
  setFinanceFilter,
  handleExportCSV,
}: FinanceTabProps) {
  const filteredBets =
    financeFilter === 'all'
      ? bets
      : bets.filter((b) => b.lottery === financeFilter);

  // Cálculos
  const totalCost = bets.reduce((s, b) => s + Number(b.cost), 0);
  const totalPrize = bets.reduce((s, b) => s + Number(b.prize_won), 0);
  const profit = totalPrize - totalCost;
  const roi =
    totalCost > 0
      ? (((totalPrize - totalCost) / totalCost) * 100).toFixed(1)
      : '0.0';
  const winRate =
    bets.length > 0
      ? (
          (bets.filter((b) => Number(b.prize_won) > 0).length / bets.length) *
          100
        ).toFixed(1)
      : '0.0';

  // Média mensal
  const monthMap: Record<
    string,
    { cost: number; prize: number; count: number }
  > = {};
  bets.forEach((b) => {
    const key = getMonthKey(b.created_at || new Date().toISOString());
    if (!monthMap[key]) monthMap[key] = { cost: 0, prize: 0, count: 0 };
    monthMap[key].cost += Number(b.cost);
    monthMap[key].prize += Number(b.prize_won);
    monthMap[key].count += 1;
  });
  const sortedMonths = Object.keys(monthMap).sort().reverse();
  const avgMonthlyCost =
    sortedMonths.length > 0 ? totalCost / sortedMonths.length : 0;
  const avgMonthlyPrize =
    sortedMonths.length > 0 ? totalPrize / sortedMonths.length : 0;
  const avgMonthlyLoss = avgMonthlyCost - avgMonthlyPrize;

  // Perda acumulada
  const cumulativeLoss = totalCost - totalPrize;

  return (
    <div
      className="profile-card animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {!isPro ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💰</div>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.3rem',
              fontWeight: 900,
              color: 'white',
              marginBottom: '0.5rem',
            }}
          >
            Central Financeira PRO
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            Registre apostas, acompanhe gastos e calcule seu ROI. Recurso
            exclusivo do plano PRO.
          </p>
          <button
            className="btn-action"
            onClick={() => {
              playSound('click');
              setShowUpgradeModal(true);
            }}
            style={{
              background: 'linear-gradient(90deg, #ff007f, #ffd600)',
              color: 'black',
              fontWeight: 'bold',
            }}
          >
            ⚡ Assinar PRO
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              paddingBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: 0,
                }}
              >
                💰 CENTRAL FINANCEIRA
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  margin: 0,
                }}
              >
                Gerencie suas apostas, custos e prêmios. Veja seu ROI em tempo
                real.
              </p>
            </div>
            {bets.length > 0 && (
              <button
                onClick={handleExportCSV}
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid var(--accent-color)',
                  color: 'var(--accent-color)',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                📥 Exportar CSV
              </button>
            )}
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
            <strong style={{ color: 'white' }}>
              O que estes números significam:
            </strong>
            <br />• <strong style={{ color: '#ff4466' }}>Total Gasto:</strong>{' '}
            Quanto você já apostou no total
            <br />• <strong style={{ color: '#00e676' }}>
              Total Ganho:
            </strong>{' '}
            Quanto você já ganhou no total
            <br />• <strong style={{ color: '#00f0ff' }}>ROI:</strong> Retorno
            sobre investimento. ROI negativo = prejuízo. Ex: -60% significa que
            a cada R$ 1 apostado, você perdeu R$ 0,60
            <br />•{' '}
            <strong style={{ color: '#ffd600' }}>Taxa de Acerto:</strong> % de
            apostas que tiveram pelo menos 1 acerto
          </div>

          {/* Alerta de Perda Acumulada */}
          {totalCost > 0 && (
            <div
              style={{
                fontSize: '0.6rem',
                lineHeight: 1.5,
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                background:
                  cumulativeLoss > 0
                    ? 'rgba(255,68,102,0.05)'
                    : 'rgba(0,230,118,0.05)',
                border: `1px solid ${cumulativeLoss > 0 ? 'rgba(255,68,102,0.12)' : 'rgba(0,230,118,0.12)'}`,
                color: cumulativeLoss > 0 ? '#ff8a80' : '#69f0ae',
              }}
            >
              {cumulativeLoss > 0 ? (
                <>
                  <strong>📉 Perda acumulada:</strong> R${' '}
                  {cumulativeLoss.toFixed(2).replace('.', ',')} (
                  {avgMonthlyLoss > 0 &&
                    `~R$ ${avgMonthlyLoss.toFixed(2).replace('.', ',')}/mês em ${sortedMonths.length} meses`}
                  )
                  <br />
                  <span style={{ opacity: 0.8 }}>
                    Cada R$ 1,00 apostado retornou apenas R${' '}
                    {(1 + parseFloat(roi) / 100).toFixed(2).replace('.', ',')}.
                    A loteria retém em média 50% do valor apostado.
                  </span>
                </>
              ) : (
                <>
                  <strong>🎉 Lucro acumulado:</strong> +R${' '}
                  {profit.toFixed(2).replace('.', ',')} — Você está acima da
                  média! A maioria dos apostadores tem prejuízo.
                </>
              )}
            </div>
          )}

          {/* ROI Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                background: 'rgba(255,0,127,0.05)',
                border: '1px solid rgba(255,0,127,0.2)',
                padding: '0.75rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Total Gasto
              </div>
              <strong
                style={{
                  fontSize: '1.2rem',
                  color: '#ff4466',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                R$ {totalCost.toFixed(2).replace('.', ',')}
              </strong>
            </div>
            <div
              style={{
                background: 'rgba(0,230,118,0.05)',
                border: '1px solid rgba(0,230,118,0.2)',
                padding: '0.75rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Total Ganho
              </div>
              <strong
                style={{
                  fontSize: '1.2rem',
                  color: '#00e676',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                R$ {totalPrize.toFixed(2).replace('.', ',')}
              </strong>
            </div>
            <div
              style={{
                background:
                  profit >= 0 ? 'rgba(0,240,255,0.05)' : 'rgba(255,0,127,0.05)',
                border:
                  profit >= 0
                    ? '1px solid rgba(0,240,255,0.2)'
                    : '1px solid rgba(255,0,127,0.2)',
                padding: '0.75rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                ROI
              </div>
              <strong
                style={{
                  fontSize: '1.2rem',
                  color: profit >= 0 ? '#00f0ff' : '#ff4466',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                {roi}%
              </strong>
            </div>
            <div
              style={{
                background: 'rgba(255,214,0,0.05)',
                border: '1px solid rgba(255,214,0,0.2)',
                padding: '0.75rem',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                Taxa Acerto
              </div>
              <strong
                style={{
                  fontSize: '1.2rem',
                  color: '#ffd600',
                  fontFamily: 'var(--font-numbers)',
                }}
              >
                {winRate}%
              </strong>
            </div>
          </div>

          {/* Projeção Mensal */}
          {sortedMonths.length > 0 && (
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
                  fontSize: '0.75rem',
                  color: 'white',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                📅 Evolução Mensal
              </h4>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.5,
                }}
              >
                Veja como seus gastos e ganhos evoluíram mês a mês. Se os meses
                estiverem vermelhos, considere reduzir as apostas.
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {sortedMonths.map((month) => {
                  const data = monthMap[month];
                  const monthProfit = data.prize - data.cost;
                  const pct =
                    data.cost > 0
                      ? ((monthProfit / data.cost) * 100).toFixed(0)
                      : '0';
                  return (
                    <div
                      key={month}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '6px',
                        background:
                          monthProfit >= 0
                            ? 'rgba(0,230,118,0.03)'
                            : 'rgba(255,68,102,0.03)',
                        border: `1px solid ${monthProfit >= 0 ? 'rgba(0,230,118,0.08)' : 'rgba(255,68,102,0.08)'}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6rem',
                          color: 'white',
                          fontWeight: 600,
                          minWidth: '60px',
                        }}
                      >
                        {formatMonth(month)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.55rem',
                          color: 'var(--text-muted)',
                          flex: 1,
                        }}
                      >
                        {data.count} apostas
                      </span>
                      <span style={{ fontSize: '0.55rem', color: '#ff4466' }}>
                        -R$ {data.cost.toFixed(2).replace('.', ',')}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: '#00e676' }}>
                        +R$ {data.prize.toFixed(2).replace('.', ',')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.55rem',
                          color: monthProfit >= 0 ? '#00f0ff' : '#ff4466',
                          fontWeight: 700,
                          fontFamily: 'var(--font-numbers)',
                          minWidth: '55px',
                          textAlign: 'right',
                        }}
                      >
                        {monthProfit >= 0 ? '+' : ''}
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Média mensal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '0.6rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Média mensal:
                </span>
                <span
                  style={{
                    color: avgMonthlyLoss > 0 ? '#ff4466' : '#00e676',
                    fontWeight: 700,
                    fontFamily: 'var(--font-numbers)',
                  }}
                >
                  Gasto: R$ {avgMonthlyCost.toFixed(2).replace('.', ',')} ·
                  Ganho: R$ {avgMonthlyPrize.toFixed(2).replace('.', ',')} ·{' '}
                  {avgMonthlyLoss > 0 ? 'Perda' : 'Lucro'}: R${' '}
                  {Math.abs(avgMonthlyLoss).toFixed(2).replace('.', ',')}/mês
                </span>
              </div>
            </div>
          )}

          {/* Projeção de 12 meses */}
          {sortedMonths.length >= 2 && (
            <div
              style={{
                fontSize: '0.6rem',
                lineHeight: 1.5,
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,214,0,0.03)',
                border: '1px solid rgba(255,214,0,0.08)',
                color: '#ffd600',
              }}
            >
              <strong>📊 Projeção para 12 meses:</strong> Se você mantiver o
              ritmo atual de R$ {avgMonthlyCost.toFixed(2).replace('.', ',')}
              /mês, em 12 meses você terá apostado{' '}
              <strong>
                R$ {(avgMonthlyCost * 12).toFixed(2).replace('.', ',')}
              </strong>{' '}
              e ganhado{' '}
              <strong>
                R$ {(avgMonthlyPrize * 12).toFixed(2).replace('.', ',')}
              </strong>
              , resultando em {avgMonthlyLoss > 0 ? 'perda' : 'lucro'} de{' '}
              <strong>
                R${' '}
                {(Math.abs(avgMonthlyLoss) * 12).toFixed(2).replace('.', ',')}
              </strong>
              .
            </div>
          )}

          {/* Consolidado por Loteria */}
          {bets.length > 0 && (
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
                  fontSize: '0.75rem',
                  color: 'white',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                📊 Consolidado por Jogo
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {Object.entries(
                  bets.reduce(
                    (acc, b) => {
                      const lot = b.lottery;
                      if (!acc[lot]) {
                        acc[lot] = { cost: 0, prize: 0, count: 0 };
                      }
                      acc[lot].cost += Number(b.cost);
                      acc[lot].prize += Number(b.prize_won);
                      acc[lot].count += 1;
                      return acc;
                    },
                    {} as Record<
                      string,
                      { cost: number; prize: number; count: number }
                    >
                  )
                ).map(([lotKey, data]) => {
                  const lotConfig =
                    LOTTERY_CONFIGS[lotKey as keyof typeof LOTTERY_CONFIGS];
                  const lotProfit = data.prize - data.cost;
                  const lotRoi =
                    data.cost > 0
                      ? ((lotProfit / data.cost) * 100).toFixed(0)
                      : '0';
                  return (
                    <div
                      key={lotKey}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        fontSize: '0.7rem',
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--accent-color)',
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {lotConfig?.name || lotKey} ({data.count}{' '}
                        {data.count === 1 ? 'aposta' : 'apostas'})
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Gasto:</span>
                        <span
                          style={{
                            color: '#ff4466',
                            fontFamily: 'var(--font-numbers)',
                          }}
                        >
                          R$ {data.cost.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Ganho:</span>
                        <span
                          style={{
                            color: '#00e676',
                            fontFamily: 'var(--font-numbers)',
                          }}
                        >
                          R$ {data.prize.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 'bold',
                          borderTop: '1px solid rgba(255,255,255,0.03)',
                          marginTop: '0.2rem',
                          paddingTop: '0.2rem',
                        }}
                      >
                        <span>ROI:</span>
                        <span
                          style={{
                            color: lotProfit >= 0 ? '#00f0ff' : '#ff4466',
                            fontFamily: 'var(--font-numbers)',
                          }}
                        >
                          {lotProfit >= 0 ? '+' : ''}
                          {lotRoi}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Bet Form */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                }}
              >
                ➕ Registrar Aposta
              </h3>
              <p
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                }}
              >
                Registre suas apostas para acompanhar gastos e calcular o ROI
                automaticamente.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Loteria
                </label>
                <select
                  value={betForm.lottery}
                  onChange={(e) =>
                    setBetForm((f) => ({ ...f, lottery: e.target.value }))
                  }
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                >
                  {Object.entries(LOTTERY_CONFIGS).map(([k, v]) => (
                    <option key={k} value={k} style={{ background: '#111' }}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Nº do Concurso
                </label>
                <input
                  type="number"
                  placeholder="Ex: 2750"
                  value={betForm.contest_num}
                  onChange={(e) =>
                    setBetForm((f) => ({ ...f, contest_num: e.target.value }))
                  }
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Custo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5.00"
                  value={betForm.cost}
                  onChange={(e) =>
                    setBetForm((f) => ({ ...f, cost: e.target.value }))
                  }
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <label
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Prêmio Ganho (R$){' '}
                  <span
                    style={{ color: 'var(--accent-color)', fontSize: '0.6rem' }}
                  >
                    — calculado auto
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Calculado automaticamente"
                  value={betForm.prize_won}
                  onChange={(e) =>
                    setBetForm((f) => ({ ...f, prize_won: e.target.value }))
                  }
                  style={{
                    background: 'rgba(0,240,255,0.04)',
                    border: '1px solid rgba(0,240,255,0.15)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: '#00f0ff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Números Jogados
              </label>
              <input
                type="text"
                placeholder="Ex: 01-07-23-41-51-60 (sep. por hífen, vírgula ou espaço)"
                value={betForm.numbers}
                onChange={(e) =>
                  setBetForm((f) => ({ ...f, numbers: e.target.value }))
                }
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  color: 'white',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            {betFeedback && (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: betFeedback.startsWith('✓')
                    ? '#00e676'
                    : betFeedback.startsWith('🎯')
                      ? '#ffd600'
                      : '#ff4466',
                  margin: 0,
                }}
              >
                {betFeedback}
              </p>
            )}
            <button
              className="btn-action"
              disabled={betFormLoading}
              onClick={async () => {
                if (!betForm.numbers || !betForm.contest_num || !betForm.cost) {
                  setBetFeedback(
                    '⚠️ Preencha loteria, concurso, números e custo.'
                  );
                  return;
                }
                setBetFormLoading(true);
                setBetFeedback('🔍 Buscando resultado do concurso...');
                let calculatedPrize = 0;
                let hitsMsg = '';
                try {
                  const resultRes = await fetchWithCsrf(
                    `/api/loteria/${betForm.lottery}?concurso=${betForm.contest_num}`
                  );
                  if (resultRes.ok) {
                    const contestData =
                      (await resultRes.json()) as LotteryResult;
                    const drawnNums = (contestData.listaDezenas || []).map(
                      (n: string) => parseInt(n, 10)
                    );
                    const userNums = betForm.numbers
                      .split(/[-,\s]+/)
                      .map((n: string) => parseInt(n.trim(), 10))
                      .filter((n: number) => !isNaN(n));
                    const hits = userNums.filter((n: number) =>
                      drawnNums.includes(n)
                    ).length;
                    const hitsList = userNums.filter((n: number) =>
                      drawnNums.includes(n)
                    );
                    const minHitsMap: Record<
                      string,
                      { faixa: number; minHits: number }[]
                    > = {
                      megasena: [
                        { faixa: 1, minHits: 6 },
                        { faixa: 2, minHits: 5 },
                        { faixa: 3, minHits: 4 },
                      ],
                      lotofacil: [
                        { faixa: 1, minHits: 15 },
                        { faixa: 2, minHits: 14 },
                        { faixa: 3, minHits: 13 },
                        { faixa: 4, minHits: 12 },
                        { faixa: 5, minHits: 11 },
                      ],
                      quina: [
                        { faixa: 1, minHits: 5 },
                        { faixa: 2, minHits: 4 },
                        { faixa: 3, minHits: 3 },
                        { faixa: 4, minHits: 2 },
                      ],
                      lotomania: [
                        { faixa: 1, minHits: 20 },
                        { faixa: 2, minHits: 19 },
                        { faixa: 3, minHits: 18 },
                        { faixa: 4, minHits: 17 },
                        { faixa: 5, minHits: 16 },
                        { faixa: 6, minHits: 0 },
                      ],
                      maismilionaria: [
                        { faixa: 1, minHits: 6 },
                        { faixa: 2, minHits: 5 },
                        { faixa: 3, minHits: 4 },
                        { faixa: 4, minHits: 3 },
                        { faixa: 5, minHits: 2 },
                      ],
                    };
                    const hitsConfig = minHitsMap[betForm.lottery] || [
                      { faixa: 1, minHits: 6 },
                      { faixa: 2, minHits: 5 },
                      { faixa: 3, minHits: 4 },
                    ];
                    const matchedFaixa = hitsConfig.find(
                      (f) => hits >= f.minHits
                    );
                    const rateiro = contestData.listaRateioPremio || [];
                    if (matchedFaixa && rateiro.length > 0) {
                      const prizeEntry = rateiro.find(
                        (r) => r.faixa === matchedFaixa.faixa
                      );
                      if (prizeEntry && prizeEntry.valorPremio > 0) {
                        calculatedPrize = prizeEntry.valorPremio;
                      }
                    }
                    hitsMsg =
                      hits > 0
                        ? `🎯 ${hits} acerto(s): [${hitsList.map((n: number) => String(n).padStart(2, '0')).join(', ')}] — ${calculatedPrize > 0 ? `Prêmio: R$ ${calculatedPrize.toFixed(2).replace('.', ',')}` : 'Sem prêmio nessa faixa'}`
                        : '❌ Nenhum acerto neste concurso.';
                    setBetForm((f) => ({
                      ...f,
                      prize_won:
                        calculatedPrize > 0 ? calculatedPrize.toFixed(2) : '0',
                    }));
                    setBetFeedback(hitsMsg);
                  } else {
                    setBetFeedback(
                      '⚠️ Não foi possível buscar o concurso. Ajuste o prêmio manualmente se necessário.'
                    );
                  }
                } catch {
                  setBetFeedback(
                    '⚠️ Erro ao consultar resultado. Ajuste o prêmio manualmente se necessário.'
                  );
                }
                try {
                  const res = await fetchWithCsrf('/api/bets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lottery: betForm.lottery,
                      numbers: betForm.numbers,
                      contest_num: Number(betForm.contest_num),
                      cost: Number(betForm.cost),
                      prize_won:
                        calculatedPrize > 0
                          ? calculatedPrize
                          : Number(betForm.prize_won || '0'),
                    }),
                  });
                  if (res.ok) {
                    setBetFeedback(
                      hitsMsg ? `✓ Salvo! ${hitsMsg}` : '✓ Aposta registrada!'
                    );
                    setBetForm((f) => ({
                      ...f,
                      numbers: '',
                      contest_num: '',
                      cost: '',
                      prize_won: '',
                    }));
                    const gRes = await fetchWithCsrf('/api/bets');
                    if (gRes.ok) {
                      const d = await gRes.json();
                      setBets(d.bets || []);
                    }
                    playSound('success');
                    setTimeout(() => setBetFeedback(''), 6000);
                  } else {
                    const d = await res.json();
                    setBetFeedback(`⚠️ ${d.error || 'Erro ao salvar'}`);
                    playSound('delete');
                  }
                } catch {
                  setBetFeedback('⚠️ Erro de conexão');
                }
                setBetFormLoading(false);
              }}
              style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
              }}
            >
              {betFormLoading ? '🔍 Verificando...' : '🎯 Verificar & Salvar'}
            </button>
          </div>

          {/* Bet History */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                }}
              >
                📋 Histórico de Apostas
              </h3>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <select
                  value={financeFilter}
                  onChange={(e) => setFinanceFilter(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">Todas as loterias</option>
                  {Object.entries(LOTTERY_CONFIGS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(0,240,255,0.08)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    color: 'var(--accent-color)',
                    borderRadius: '6px',
                    padding: '0.25rem 0.6rem',
                    cursor: 'pointer',
                  }}
                  onClick={async () => {
                    setBetsLoading(true);
                    try {
                      const r = await fetchWithCsrf('/api/bets');
                      if (r.ok) {
                        const d = await r.json();
                        setBets(d.bets || []);
                      }
                    } finally {
                      setBetsLoading(false);
                    }
                  }}
                >
                  🔄
                </button>
              </div>
            </div>
            {betsLoading ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  padding: '1rem 0',
                }}
              >
                Carregando...
              </p>
            ) : filteredBets.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  padding: '1.5rem 0',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {bets.length === 0
                  ? 'Nenhuma aposta registrada ainda.'
                  : 'Nenhuma aposta encontrada para este filtro.'}
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem',
                }}
              >
                {filteredBets.map((bet) => {
                  const betProfit = Number(bet.prize_won) - Number(bet.cost);
                  return (
                    <div
                      key={bet.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.2rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: 'rgba(0,240,255,0.1)',
                              border: '1px solid rgba(0,240,255,0.2)',
                              borderRadius: '4px',
                              padding: '0.1rem 0.35rem',
                              color: 'var(--accent-color)',
                              textTransform: 'uppercase',
                            }}
                          >
                            {LOTTERY_CONFIGS[
                              bet.lottery as keyof typeof LOTTERY_CONFIGS
                            ]?.name || bet.lottery}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Conc. #{bet.contest_num}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'white',
                            fontFamily: 'var(--font-numbers)',
                            marginBottom: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bet.numbers}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            fontSize: '0.7rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ color: '#ff4466' }}>
                            Gasto: R${' '}
                            {Number(bet.cost).toFixed(2).replace('.', ',')}
                          </span>
                          <span style={{ color: '#00e676' }}>
                            Prêmio: R${' '}
                            {Number(bet.prize_won).toFixed(2).replace('.', ',')}
                          </span>
                          <span
                            style={{
                              color: betProfit >= 0 ? '#00f0ff' : '#ff4466',
                              fontWeight: 700,
                              fontFamily: 'var(--font-numbers)',
                            }}
                          >
                            {betProfit >= 0 ? '+' : ''}R${' '}
                            {betProfit.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Remover esta aposta?')) return;
                          try {
                            const r = await fetchWithCsrf(
                              `/api/bets?id=${bet.id}`,
                              { method: 'DELETE' }
                            );
                            if (r.ok) {
                              setBets((prev) =>
                                prev.filter((b) => b.id !== bet.id)
                              );
                              playSound('delete');
                            }
                          } catch {
                            /* ignore */
                          }
                        }}
                        style={{
                          background: 'rgba(255,68,102,0.08)',
                          border: '1px solid rgba(255,68,102,0.2)',
                          color: '#ff4466',
                          borderRadius: '8px',
                          padding: '0.4rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          flexShrink: 0,
                        }}
                        title="Remover aposta"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
