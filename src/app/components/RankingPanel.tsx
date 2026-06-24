'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';

interface LeaderboardEntry {
  position: number;
  name: string;
  user_id: string;
  total_bets: number;
  total_hits: number;
  best_hit: number;
  total_prize: number;
  avg_hits: number;
  is_mock?: boolean;
}

interface UserStats {
  total_bets: number;
  total_hits: number;
  best_hit: number;
  total_prize: number;
}

interface User {
  id: string;
  name: string;
}

interface Badge {
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

interface Props {
  user?: User | null;
  savedGames?: { id: string; lottery: string; numbers: string }[];
  playSound?: (s: string) => void;
}

function computeBadges(
  stats: UserStats | null,
  savedGames: { lottery: string }[]
): Badge[] {
  const totalGames = stats?.total_bets || 0;
  const totalHits = stats?.total_hits || 0;
  const bestHit = stats?.best_hit || 0;
  const totalPrize = stats?.total_prize || 0;
  const uniqueLotteries = new Set(savedGames.map((g) => g.lottery)).size;

  return [
    {
      icon: '🎯',
      name: 'Primeiro Jogo',
      desc: 'Registrou seu primeiro jogo',
      unlocked: totalGames >= 1,
    },
    {
      icon: '🔥',
      name: 'Fogareiro',
      desc: 'Registrou 10 ou mais jogos',
      unlocked: totalGames >= 10,
    },
    {
      icon: '💪',
      name: 'Veterano',
      desc: 'Registrou 50 ou mais jogos',
      unlocked: totalGames >= 50,
    },
    {
      icon: '🏅',
      name: 'Acertador',
      desc: 'Acertou 4 ou mais dezenas em um jogo',
      unlocked: bestHit >= 4,
    },
    {
      icon: '👑',
      name: 'Rei dos Acertos',
      desc: 'Acertou 5 ou mais dezenas em um jogo',
      unlocked: bestHit >= 5,
    },
    {
      icon: '💰',
      name: 'Lucrou',
      desc: 'Ganhou algum prêmio',
      unlocked: totalPrize > 0,
    },
    {
      icon: '📊',
      name: 'Analista',
      desc: 'Jogou em 3 ou mais loterias diferentes',
      unlocked: uniqueLotteries >= 3,
    },
    {
      icon: '🧩',
      name: 'Explorador',
      desc: 'Jogou em 5 ou mais loterias diferentes',
      unlocked: uniqueLotteries >= 5,
    },
    {
      icon: '🌟',
      name: 'Em Chamas',
      desc: 'Acertou mais de 10 dezenas no total',
      unlocked: totalHits >= 10,
    },
    {
      icon: '🏆',
      name: 'Top 3',
      desc: 'Chegou ao top 3 do ranking',
      unlocked: false,
    },
  ];
}

export default function RankingPanel({ user, savedGames = [] }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState('all');

  const loadRanking = useCallback(
    async (nextFilter: string, nextPeriod: string) => {
      try {
        const response = await fetch(
          `/api/ranking?lottery=${nextFilter}&period=${nextPeriod}`
        );
        const data = await response.json();
        setEntries(data.leaderboard || []);
        setUserStats(data.user_stats || null);
      } catch {
        setEntries([]);
        setUserStats(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    queueMicrotask(() => {
      void loadRanking(filter, period);
    });
  }, [filter, loadRanking, period]);

  const badges = computeBadges(userStats, savedGames);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const medalFor = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `#${pos}`;
  };

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
          <span>🏆</span> RANKING GERAL
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.25rem',
          }}
        >
          Quem acerta mais dezenas entre os usuários do Meu Trevo.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select
          value={filter}
          onChange={(e) => {
            setLoading(true);
            setFilter(e.target.value);
          }}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.7rem',
            padding: '0.35rem 0.5rem',
            outline: 'none',
          }}
        >
          <option value="all">Todas Loterias</option>
          {Object.entries(LOTTERY_CONFIGS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => {
            setLoading(true);
            setPeriod(e.target.value);
          }}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.7rem',
            padding: '0.35rem 0.5rem',
            outline: 'none',
          }}
        >
          <option value="all">Todo período</option>
          <option value="month">Último mês</option>
          <option value="week">Última semana</option>
        </select>
      </div>

      {/* User Stats — only show for logged in users */}
      {user && (
        <div
          style={{
            background: 'rgba(0,240,255,0.05)',
            border: '1px solid rgba(0,240,255,0.15)',
            borderRadius: '10px',
            padding: '0.75rem',
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
          >
            📊 Seus resultados — dados da aba <strong>Finanças</strong>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Jogos registrados
              </div>
              <strong style={{ fontSize: '1rem', color: 'white' }}>
                {userStats?.total_bets || 0}
              </strong>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Acertos totais
              </div>
              <strong style={{ fontSize: '1rem', color: '#00e676' }}>
                {userStats?.total_hits || 0}
              </strong>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Melhor acerto
              </div>
              <strong style={{ fontSize: '1rem', color: '#ffd600' }}>
                {userStats?.best_hit || 0}
              </strong>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Prêmios ganhos
              </div>
              <strong style={{ fontSize: '1rem', color: '#00f0ff' }}>
                R$ {(userStats?.total_prize || 0).toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>
          {(!userStats || userStats.total_bets === 0) && (
            <div
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '0.5rem',
              }}
            >
              Registre seus jogos na aba Finanços para aparecer aqui!
            </div>
          )}
        </div>
      )}

      {!user && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '0.75rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Faça <strong style={{ color: '#00f0ff' }}>login</strong> para ver
            seus resultados pessoais e participar do ranking.
          </div>
        </div>
      )}

      {/* Badges / Conquistas */}
      {user && (
        <div
          style={{
            background: 'rgba(255,214,0,0.03)',
            border: '1px solid rgba(255,214,0,0.12)',
            borderRadius: '10px',
            padding: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              🏅 Conquistas
            </div>
            <div style={{ fontSize: '0.6rem', color: '#ffd600' }}>
              {unlockedCount}/{badges.length} desbloqueadas
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: '0.4rem',
            }}
          >
            {badges.map((badge, i) => (
              <div
                key={i}
                style={{
                  background: badge.unlocked
                    ? 'rgba(255,214,0,0.08)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${badge.unlocked ? 'rgba(255,214,0,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '8px',
                  padding: '0.5rem',
                  textAlign: 'center',
                  opacity: badge.unlocked ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '1.2rem',
                    marginBottom: '0.2rem',
                    filter: badge.unlocked ? 'none' : 'grayscale(1)',
                  }}
                >
                  {badge.icon}
                </div>
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    color: badge.unlocked ? '#ffd600' : 'var(--text-muted)',
                  }}
                >
                  {badge.name}
                </div>
                <div
                  style={{
                    fontSize: '0.45rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.15rem',
                  }}
                >
                  {badge.desc}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: '0.5rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '0.5rem',
              fontStyle: 'italic',
            }}
          >
            Jogos registrados e acertos geram conquistas automaticamente!
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
          }}
        >
          <span className="loader" style={{ display: 'inline-block' }} />
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Carregando ranking...
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏅</div>
          <p style={{ fontSize: '0.85rem' }}>
            Nenhum resultado registrado ainda.
          </p>
          <p style={{ fontSize: '0.75rem' }}>
            Registre seus jogos na aba Financeiro para aparecer aqui!
          </p>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
        >
          {entries.map((entry) => {
            const isMock = entry.is_mock === true;
            return (
              <div
                key={entry.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  background:
                    entry.position <= 3 && !isMock
                      ? `rgba(${entry.position === 1 ? '255,214,0' : entry.position === 2 ? '192,192,192' : '205,127,50'},0.05)`
                      : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${entry.position <= 3 && !isMock ? `rgba(${entry.position === 1 ? '255,214,0' : entry.position === 2 ? '192,192,192' : '205,127,50'},0.2)` : 'rgba(255,255,255,0.03)'}`,
                  opacity: isMock ? 0.7 : 1,
                }}
              >
                <span
                  style={{
                    minWidth: '28px',
                    textAlign: 'center',
                    fontSize:
                      entry.position <= 3 && !isMock ? '1.1rem' : '0.75rem',
                    fontWeight: 700,
                    color:
                      entry.position <= 3 && !isMock
                        ? 'white'
                        : 'var(--text-muted)',
                  }}
                >
                  {medalFor(entry.position)}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isMock ? 'var(--text-muted)' : 'white',
                    }}
                  >
                    {entry.name}
                  </div>
                  <div
                    style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
                  >
                    {entry.total_bets} apostas · {entry.avg_hits} acertos/aposta
                    {isMock && (
                      <span
                        style={{ marginLeft: '0.3rem', opacity: 0.5 }}
                      ></span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#00e676',
                    }}
                  >
                    {entry.total_hits} acertos
                  </div>
                  {entry.total_prize > 0 && (
                    <div
                      style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
                    >
                      R$ {entry.total_prize.toFixed(0)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
