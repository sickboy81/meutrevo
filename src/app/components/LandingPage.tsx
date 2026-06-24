'use client';

import React from 'react';
import type { LotteryResult } from '../types';

interface LandingPageProps {
  result: LotteryResult | null;
  history: LotteryResult[];
  isAnnual: boolean;
  setIsAnnual: (v: boolean) => void;
  priceMonthly: number;
  priceAnnualEquivalent: number;
  activeFaqIndex: number | null;
  setActiveFaqIndex: (v: number | null) => void;
  setShowUpgradeModal: (v: boolean) => void;
  landingQuickNums: number[];
  setLandingQuickNums: React.Dispatch<React.SetStateAction<number[]>>;
  landingQuickResult: string;
  setLandingQuickResult: (v: string) => void;
  landingQuickStats: {
    sum: number;
    even: number;
    odd: number;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  activeLottery: string;
  setActiveLottery: (v: string) => void;
  config: { color: string; accentColor: string };
  playSound: (type: 'click' | 'success' | 'delete') => void;
  setViewMode: (v: 'landing' | 'app') => void;
  getCleanDezenas: (result: LotteryResult) => string[];
  handleToggleLandingNum: (num: number) => void;
  handleGenerateLandingSmart: () => void;
  handleTestLandingGame: () => void;
}

export default function LandingPage({
  result,
  history,
  isAnnual,
  setIsAnnual,
  priceMonthly,
  priceAnnualEquivalent,
  activeFaqIndex,
  setActiveFaqIndex,
  setShowUpgradeModal,
  landingQuickNums,
  setLandingQuickNums,
  landingQuickResult,
  setLandingQuickResult,
  landingQuickStats,
  activeLottery,
  setActiveLottery,
  config,
  playSound,
  setViewMode,
  getCleanDezenas,
  handleToggleLandingNum,
  handleGenerateLandingSmart,
  handleTestLandingGame,
}: LandingPageProps) {
  return (
    <div className="landing-container animate-fade-in">
      {/* Header */}
      <header className="landing-header">
        <div className="logo-container">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.8))' }}
          >
            <path
              d="M12 12c0 3.5 1 6.5 2.5 8"
              stroke="#00ff88"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <g
              fill="#00ff88"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fillOpacity="0.2"
            >
              <path d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z" />
              <path
                d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                transform="rotate(90 12 12)"
              />
              <path
                d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                transform="rotate(180 12 12)"
              />
              <path
                d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                transform="rotate(270 12 12)"
              />
            </g>
          </svg>
          <div
            className="logo-text"
            style={{
              fontSize: '1.4rem',
              textShadow: '0 0 10px var(--accent-glow)',
            }}
          >
            Meu Trevo
          </div>
          <span className="badge-live" style={{ animationDuration: '1s' }}>
            RESULTADOS + ESTRATÉGIA
          </span>
        </div>
        <div
          style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }}
          className="desktop-nav-links"
        >
          <a
            href="#features"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            Como ajuda
          </a>
          <a
            href="#testador"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            Testar jogo
          </a>
          <a
            href="#pricing"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            Planos
          </a>
          <a
            href="#faq"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-muted)')
            }
          >
            FAQ
          </a>
        </div>
        <button
          className="theme-pill-btn active"
          onClick={() => {
            playSound('click');
            setViewMode('app');
          }}
          style={{
            fontSize: '0.8rem',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            borderRadius: '8px',
            boxShadow: '0 0 10px var(--accent-glow)',
          }}
        >
          Começar grátis ➜
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing-hero landing-hero-sales">
        <div className="landing-hero-copy">
          <h1 className="landing-title">Meu Trevo</h1>
          <p className="landing-hero-lead">
            Monte jogos de loteria com resultado oficial, análise histórica e
            desdobramentos em um painel simples de usar.
          </p>
          <p className="landing-subtitle">
            Consulte concursos da Caixa, teste suas dezenas antes de apostar e
            gere combinações com filtros de soma, atraso, par/ímpar e custo.
          </p>

          <div
            className="landing-proof-row"
            aria-label="Destaques do Meu Trevo"
          >
            <span>
              <strong>Caixa</strong> resultados oficiais
            </span>
            <span>
              <strong>Simulação</strong> histórico recente
            </span>
            <span>
              <strong>Pix</strong> Pro imediato
            </span>
          </div>

          <div className="landing-cta-group landing-hero-actions">
            <button
              className="landing-btn-primary"
              onClick={() => {
                playSound('success');
                setViewMode('app');
              }}
            >
              Começar grátis
            </button>
            <button
              className="landing-btn-secondary"
              onClick={() => {
                playSound('click');
                const target = document.getElementById('testador-anchor');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Testar meu jogo
            </button>
          </div>
        </div>

        <div
          className="landing-hero-preview"
          aria-label="Prévia do painel Meu Trevo"
        >
          <div className="hero-preview-header">
            <div>
              <span className="hero-preview-kicker">Último concurso</span>
              <strong>
                Mega-Sena {result?.numero ? `#${result.numero}` : ''}
              </strong>
            </div>
            <span className="hero-preview-status">ao vivo</span>
          </div>
          <div className="hero-preview-balls">
            {(result
              ? getCleanDezenas(result).slice(0, 6)
              : ['09', '18', '26', '31', '53', '58']
            ).map((num, i) => (
              <span key={`${num}-${i}`}>{num}</span>
            ))}
          </div>
          <div className="hero-preview-grid">
            <div>
              <span>Próximo prêmio</span>
              <strong>
                {result?.valorEstimadoProximoConcurso
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(result.valorEstimadoProximoConcurso)
                  : 'R$ ---'}
              </strong>
            </div>
            <div>
              <span>Histórico</span>
              <strong>{history.length || 30} concursos</strong>
            </div>
            <div>
              <span>Filtro ativo</span>
              <strong>Par/ímpar</strong>
            </div>
            <div>
              <span>Exportação</span>
              <strong>TXT + impressão</strong>
            </div>
          </div>
          <div className="hero-preview-footer">
            <span className="pulse-dot"></span>
            Jogos montados com critérios visíveis antes da aposta
          </div>
        </div>
      </section>

      {/* Live Results Tape — seamless loop: two identical halves, translate -50% */}
      {result &&
        (() => {
          const dezenas = getCleanDezenas(result).slice(0, 6);
          const premio = result.valorEstimadoProximoConcurso
            ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(result.valorEstimadoProximoConcurso)
            : 'R$ ---';
          const items = (
            <>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#209869' }}
                />
                <strong>MEGA-SENA</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Conc. {result.numero}
                </span>
                <div style={{ display: 'flex', gap: '0.15rem' }}>
                  {dezenas.map((n, i) => (
                    <span
                      key={i}
                      className="marquee-ball"
                      style={{ background: '#209869' }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(147, 9, 143, 0.1)',
                  border: '1px solid rgba(147, 9, 143, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#93098f' }}
                />
                <strong>LOTOFÁCIL</strong>
                <span style={{ color: '#00f0ff', fontWeight: 600 }}>
                  Par/Ímpar Equilibrado
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(38, 0, 133, 0.15)',
                  border: '1px solid rgba(38, 0, 133, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#00f0ff' }}
                />
                <strong>QUINA</strong>
                <span style={{ color: '#ffd600', fontWeight: 600 }}>
                  Acúmulo Crítico
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#209869' }}
                />
                <strong>MEGA-SENA</strong>
                <span style={{ color: '#00e676', fontWeight: 600 }}>
                  Prêmio: {premio}
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(255, 0, 127, 0.1)',
                  border: '1px solid rgba(255, 0, 127, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#ff007f' }}
                />
                <strong>LOTOFÁCIL</strong>
                <span style={{ color: '#ff4466', fontWeight: 600 }}>
                  Distribuição Uniforme
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(255, 214, 0, 0.1)',
                  border: '1px solid rgba(255, 214, 0, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#ffd600' }}
                />
                <strong>QUINA</strong>
                <span style={{ color: '#ffd600', fontWeight: 600 }}>
                  Frequência Alta
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#00f0ff' }}
                />
                <strong>LOTOFÁCIL</strong>
                <span style={{ color: '#00f0ff', fontWeight: 600 }}>
                  Atraso Crítico
                </span>
              </div>
              <div
                className="marquee-item"
                style={{
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                }}
              >
                <span
                  className="marquee-dot"
                  style={{ background: '#209869' }}
                />
                <strong>MEGA-SENA</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Soma Ideal 110–180
                </span>
              </div>
            </>
          );
          return (
            <div
              className="marquee-ticker-container"
              style={{ margin: '1rem 0 2rem 0' }}
            >
              <div className="marquee-ticker-inner">
                {items}
                {items}
              </div>
            </div>
          );
        })()}

      {/* Interactive Quick Board Simulator */}
      <div id="testador-anchor" />
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
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div
              className="landing-widget-tabs"
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '0.2rem',
                borderRadius: '8px',
              }}
            >
              <button
                className={`landing-widget-tab-btn ${activeLottery === 'megasena' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveLottery('megasena');
                  setLandingQuickNums([]);
                  setLandingQuickResult('');
                }}
                style={
                  {
                    '--active-color': '#209869',
                    '--active-glow': 'rgba(32, 152, 105, 0.3)',
                  } as React.CSSProperties
                }
              >
                Mega-Sena (60)
              </button>
              <button
                className={`landing-widget-tab-btn ${activeLottery === 'lotofacil' ? 'active' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveLottery('lotofacil');
                  setLandingQuickNums([]);
                  setLandingQuickResult('');
                }}
                style={
                  {
                    '--active-color': '#93098f',
                    '--active-glow': 'rgba(147, 9, 143, 0.3)',
                  } as React.CSSProperties
                }
              >
                Lotofácil (25)
              </button>
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
                / {activeLottery === 'lotofacil' ? 15 : 6}
              </span>
              <button
                onClick={() => {
                  playSound('click');
                  setLandingQuickNums([]);
                  setLandingQuickResult('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff1744',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                }}
              >
                Limpar Volante
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
              {Array.from({
                length: activeLottery === 'lotofacil' ? 25 : 60,
              }).map((_, index) => {
                const num = index + 1;
                const isSelected = landingQuickNums.includes(num);
                return (
                  <button
                    key={num}
                    className={`landing-board-ball ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleLandingNum(num)}
                    style={
                      {
                        '--active-color': config.color,
                        '--active-glow': config.accentColor,
                        height: activeLottery === 'lotofacil' ? '42px' : '32px',
                        fontSize: '0.8rem',
                      } as React.CSSProperties
                    }
                  >
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <div
              style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <button
                className="theme-pill-btn"
                onClick={handleGenerateLandingSmart}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🎲 Completar com IA
              </button>
              <button
                className="btn-action"
                onClick={handleTestLandingGame}
                style={
                  {
                    flex: 1.2,
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    '--accent-glow': config.accentColor,
                    borderRadius: '8px',
                  } as React.CSSProperties
                }
              >
                📊 Testar Jogo
              </button>
            </div>
          </div>

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
                      {activeLottery === 'megasena' && (
                        <span
                          style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            background:
                              landingQuickStats.sum >= 110 &&
                              landingQuickStats.sum <= 180
                                ? 'rgba(0, 230, 118, 0.15)'
                                : 'rgba(255, 23, 68, 0.15)',
                            color:
                              landingQuickStats.sum >= 110 &&
                              landingQuickStats.sum <= 180
                                ? '#00e676'
                                : '#ff1744',
                          }}
                        >
                          {landingQuickStats.sum >= 110 &&
                          landingQuickStats.sum <= 180
                            ? 'Ideal'
                            : 'Fora da Média'}
                        </span>
                      )}
                      {activeLottery === 'lotofacil' && (
                        <span
                          style={{
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.3rem',
                            borderRadius: '4px',
                            background:
                              landingQuickStats.sum >= 166 &&
                              landingQuickStats.sum <= 220
                                ? 'rgba(0, 230, 118, 0.15)'
                                : 'rgba(255, 255, 23, 68, 0.15)',
                            color:
                              landingQuickStats.sum >= 166 &&
                              landingQuickStats.sum <= 220
                                ? '#00e676'
                                : '#ff1744',
                          }}
                        >
                          {landingQuickStats.sum >= 166 &&
                          landingQuickStats.sum <= 220
                            ? 'Ideal'
                            : 'Fora da Média'}
                        </span>
                      )}
                    </div>
                  </div>

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

                  {activeLottery === 'megasena' && (
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
                        {[
                          ['Q1', landingQuickStats.q1],
                          ['Q2', landingQuickStats.q2],
                          ['Q3', landingQuickStats.q3],
                          ['Q4', landingQuickStats.q4],
                        ].map(([q, val]) => (
                          <div
                            key={q}
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
                              {q}
                            </div>
                            <strong style={{ color: 'white' }}>{val}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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

      <div className="section-divider" id="features" />

      {/* Bento Features Grid */}
      <section style={{ padding: '1rem 0' }}>
        <h2 className="landing-section-title">
          <span>⚙️</span> COMO O MEU TREVO AJUDA
        </h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div
              className="feature-icon-wrapper"
              style={{
                background: 'rgba(0, 230, 118, 0.1)',
                borderColor: 'rgba(0, 230, 118, 0.2)',
                color: '#00e676',
              }}
            >
              📊
            </div>
            <div className="feature-info">
              <h3>Resultado oficial sem garimpar site</h3>
              <p>
                Veja concursos recentes, dezenas sorteadas e prêmio estimado no
                mesmo lugar em que você monta os jogos.
              </p>
            </div>
          </div>
          <div className="landing-feature-card">
            <div
              className="feature-icon-wrapper"
              style={{
                background: 'rgba(0, 240, 255, 0.1)',
                borderColor: 'rgba(0, 240, 255, 0.2)',
                color: '#00f0ff',
              }}
            >
              ⚡
            </div>
            <div className="feature-info">
              <h3>Jogos gerados com critério</h3>
              <p>
                Use filtros de soma, atraso, repetição e par/ímpar para criar
                combinações mais consistentes com seu objetivo.
              </p>
            </div>
          </div>
          <div className="landing-feature-card">
            <div
              className="feature-icon-wrapper"
              style={{
                background: 'rgba(255, 0, 127, 0.1)',
                borderColor: 'rgba(255, 0, 127, 0.2)',
                color: '#ff007f',
              }}
            >
              🔮
            </div>
            <div className="feature-info">
              <h3>Desdobramentos para jogar em grupo</h3>
              <p>
                Monte fechamentos e bolões com mais cobertura sem perder o
                controle da quantidade de volantes.
              </p>
            </div>
          </div>
          <div className="landing-feature-card">
            <div
              className="feature-icon-wrapper"
              style={{
                background: 'rgba(255, 214, 0, 0.1)',
                borderColor: 'rgba(255, 214, 0, 0.2)',
                color: '#ffd600',
              }}
            >
              💸
            </div>
            <div className="feature-info">
              <h3>Controle de custo e prêmio</h3>
              <p>
                Registre gastos, acompanhe prêmios e exporte cartões para TXT ou
                impressão quando quiser jogar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" id="pricing" />

      {/* Plan Cards / Pricing Table */}
      <section style={{ padding: '1rem 0' }}>
        <h3 className="landing-section-title">
          <span>💎</span> ESCOLHA COMO COMEÇAR
        </h3>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              color: isAnnual ? 'var(--text-muted)' : 'white',
              fontWeight: !isAnnual ? 'bold' : 'normal',
            }}
          >
            Mensal
          </span>
          <button
            onClick={() => {
              playSound('click');
              setIsAnnual(!isAnnual);
            }}
            style={{
              width: '46px',
              height: '24px',
              borderRadius: '50px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--glass-border)',
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--accent-color)',
                position: 'absolute',
                top: '2px',
                left: isAnnual ? '24px' : '2px',
                transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 5px var(--accent-glow)',
              }}
            ></div>
          </button>
          <span
            style={{
              fontSize: '0.8rem',
              color: !isAnnual ? 'var(--text-muted)' : 'white',
              fontWeight: isAnnual ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            Anual{' '}
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(0, 230, 118, 0.15)',
                color: '#00e676',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              25% OFF
            </span>
          </span>
        </div>

        <div className="landing-pricing-cards">
          <div
            className="landing-price-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="price-card-header">
                <h3>Grátis</h3>
                <p>Para consultar, testar e gerar o primeiro jogo.</p>
              </div>
              <div className="price-amount">
                <span className="price-val">Grátis</span>
              </div>
              <ul className="price-features-list">
                <li className="price-feature-item checked">
                  Resultados oficiais da Caixa
                </li>
                <li className="price-feature-item checked">
                  Testador expresso de dezenas
                </li>
                <li className="price-feature-item checked">
                  Gerador Smart básico
                </li>
                <li className="price-feature-item unchecked">
                  Meus Jogos com organização básica
                </li>
                <li className="price-feature-item unchecked">
                  Desdobramentos e simulações avançadas
                </li>
                <li className="price-feature-item unchecked">
                  Controle financeiro, exportação e temas Pro
                </li>
              </ul>
            </div>
            <button
              className="landing-btn-secondary"
              onClick={() => {
                playSound('click');
                setViewMode('app');
              }}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Começar grátis
            </button>
          </div>

          <div
            className="landing-price-card pro"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="price-card-header">
                <h3>Meu Trevo Pro</h3>
                <p>
                  Para montar jogos, bolões e desdobramentos com mais controle.
                </p>
              </div>
              <div className="price-amount">
                <span className="price-period">R$</span>
                <span className="price-val">
                  {isAnnual
                    ? priceAnnualEquivalent.toFixed(2).replace('.', ',')
                    : priceMonthly.toFixed(2).replace('.', ',')}
                </span>
                <span className="price-period">
                  {isAnnual ? '/ano' : '/mês'}
                </span>
              </div>
              {isAnnual && (
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#00e676',
                    fontWeight: 'bold',
                    marginTop: '-0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  Cobrança única anual de R${' '}
                  {priceAnnualEquivalent.toFixed(2).replace('.', ',')}
                </div>
              )}
              <ul className="price-features-list">
                <li className="price-feature-item checked">
                  <strong>Desdobramentos otimizados para bolões</strong>
                </li>
                <li className="price-feature-item checked">
                  Gerador avançado com filtros de soma, repetição e atraso
                </li>
                <li className="price-feature-item checked">
                  Meus Jogos com filtros, agrupamentos e seleção em massa
                </li>
                <li className="price-feature-item checked">
                  Simulação histórica e comparação de estratégias
                </li>
                <li className="price-feature-item checked">
                  Controle financeiro de gastos, prêmios e desempenho
                </li>
                <li className="price-feature-item checked">
                  Alertas por e-mail, temas exclusivos e recursos extras
                </li>
                <li className="price-feature-item checked">
                  Exportação, impressão e apoio para montagem de bolões
                </li>
              </ul>
            </div>
            <button
              className="landing-btn-primary"
              onClick={() => {
                playSound('success');
                setShowUpgradeModal(true);
              }}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Assinar PRO
            </button>
          </div>
        </div>
      </section>

      <div className="section-divider" id="faq" />

      {/* Accordion FAQ Section */}
      <section style={{ padding: '1rem 0 3rem 0' }}>
        <h2 className="landing-section-title">
          <span>❓</span> PERGUNTAS FREQUENTES
        </h2>
        <div className="landing-faq-accordion">
          {[
            {
              q: 'O Meu Trevo garante que eu vou ganhar na loteria?',
              a: 'Não. Loterias são jogos baseados em aleatoriedade pura e sorte. Nenhuma ferramenta pode prever os números que vão sair. O Meu Trevo utiliza estatística histórica real e análise combinatória para otimizar suas apostas, permitindo que você cubra mais números com menos cartões de forma matemática.',
            },
            {
              q: 'Como funcionam os desdobramentos (fechamentos)?',
              a: 'O desdobramento combinatório seleciona jogos específicos dentro de um grupo de números escolhidos. Por exemplo, em vez de pagar por todas as combinações de 10 números (o que seria extremamente caro), o algoritmo seleciona um conjunto otimizado de cartões simples que garante 100% de chance de Quadra se pelo menos 4 dos sorteados estiverem no seu grupo.',
            },
            {
              q: 'Como funciona a assinatura PRO e a ativação?',
              a: 'A ativação é 100% automatizada. Ao clicar em Assinar PRO, nossa API gera um QR Code Pix dinâmico. Assim que você realiza o pagamento no aplicativo do seu banco, o sistema reconhece a liquidação em segundos e libera a sua conta imediatamente.',
            },
            {
              q: 'Posso exportar os meus jogos gerados?',
              a: 'Sim! A versão PRO permite baixar os cartões gerados em formato TXT compatível com os principais importadores, ou formatar a impressão física diretamente na impressora.',
            },
          ].map((item, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => {
                    playSound('click');
                    setActiveFaqIndex(isOpen ? null : idx);
                  }}
                >
                  <span>{item.q}</span>
                  <span
                    style={{
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                      color: 'var(--accent-color)',
                      fontWeight: 'bold',
                    }}
                  >
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>
                {isOpen && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
