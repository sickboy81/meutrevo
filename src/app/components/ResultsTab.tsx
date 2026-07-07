'use client';

import React, { useState, useMemo } from 'react';
import type { LotteryResult } from '../types';

interface ResultsTabProps {
  result: LotteryResult;
  config: { color: string; accentColor: string; name: string };
  getCleanDezenas: (result: LotteryResult) => string[];
  activeLottery: string;
  customConcurso: string;
  setCustomConcurso: (v: string) => void;
  fetchResult: (lottery: string, concurso?: string) => void;
  showRateio: boolean;
  setShowRateio: (v: boolean) => void;
  history: LotteryResult[];
}

export default React.memo(function ResultsTab({
  result,
  config,
  getCleanDezenas,
  activeLottery,
  customConcurso,
  setCustomConcurso,
  fetchResult,
  showRateio,
  setShowRateio,
  history,
}: ResultsTabProps) {
  const [historySearch, setHistorySearch] = useState('');
  const hasSameDayNextDraw = Boolean(
    result.dataApuracao &&
    result.dataProximoConcurso &&
    result.dataApuracao === result.dataProximoConcurso &&
    result.numeroConcursoProximo
  );

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history.slice(1);
    const q = historySearch.trim().toLowerCase();
    return history.slice(1).filter((item) => {
      if (String(item.numero).includes(q)) return true;
      if (item.dataApuracao && item.dataApuracao.toLowerCase().includes(q))
        return true;
      const dezenas = getCleanDezenas(item).join(' ');
      if (dezenas.includes(q)) return true;
      return false;
    });
  }, [getCleanDezenas, history, historySearch]);

  const speakNumbers = () => {
    const dezenas = getCleanDezenas(result);
    const lotName = config?.name || 'loteria';
    const text = `Resultado da ${lotName}, concurso ${result.numero}. Números sorteados: ${dezenas.join(', ')}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const shareWhatsApp = () => {
    const dezenas = getCleanDezenas(result);
    const lotName = config?.name || 'loteria';
    const text = `🎰 *${lotName}* - Concurso *${result.numero}*\n📅 ${result.dataApuracao}\n\n*Números sorteados:*\n${dezenas.map((d) => `⚪ ${d}`).join('\n')}\n\n${result.acumulado ? '🔴 *ACUMULOU!*\n\n' : ''}Fonte: Meu Trevo 🍀`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Main Result */}
      <div className="glass-panel" style={{ animation: 'fade-in 0.3s ease' }}>
        <div className="panel-header">
          <div className="panel-title">
            <span style={{ color: config.accentColor }}>★</span> ÚLTIMO SORTEIO
          </div>
          <span className="contest-badge">Concurso {result.numero}</span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: hasSameDayNextDraw ? '0.35rem' : 0,
            }}
          >
            Data oficial do sorteio: <strong>{result.dataApuracao}</strong>
          </p>
          {result.statusNotice && (
            <div
              style={{
                marginTop: '0.65rem',
                padding: '0.8rem 0.9rem',
                borderRadius: '12px',
                background: 'rgba(255, 214, 0, 0.08)',
                border: '1px solid rgba(255, 214, 0, 0.22)',
                color: '#ffe082',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  marginBottom: '0.35rem',
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ color: '#fff' }}>
                  {result.statusNotice.title}
                </strong>
                <span className="contest-badge">
                  {result.statusNotice.badge}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                {result.statusNotice.message}
              </p>
              {result.statusNotice.officialUrl && (
                <a
                  href={result.statusNotice.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.45rem',
                    color: '#fff176',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                  }}
                >
                  Ver comunicado oficial da CAIXA
                </a>
              )}
            </div>
          )}
          {hasSameDayNextDraw && (
            <p
              style={{
                fontSize: '0.72rem',
                color: '#ffd54f',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Calendário especial da Caixa: este concurso foi realizado nessa
              data e o próximo concurso também está programado para o mesmo dia.
            </p>
          )}
        </div>

        {/* Drawn Balls */}
        <div className="balls-container">
          {getCleanDezenas(result).map((dezena, idx) => (
            <span
              key={idx}
              className={`ball neon${activeLottery === 'loteriafederal' ? ' ball-federal' : ''}`}
              style={
                {
                  '--ball-color': config.color,
                  '--ball-glow': config.accentColor,
                } as React.CSSProperties
              }
            >
              {dezena}
            </span>
          ))}

          {activeLottery === 'maismilionaria' && result.trevosSorteados && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginLeft: '0.5rem',
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                paddingLeft: '0.5rem',
              }}
            >
              {result.trevosSorteados.map((trevo, idx) => (
                <span key={idx} className="ball trevo">
                  {trevo}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Voice & Share buttons */}
        <div
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}
        >
          <button
            onClick={speakNumbers}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-muted)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
          >
            🔊 Ouvir Números
          </button>
          <button
            onClick={shareWhatsApp}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(37,211,102,0.2)',
              background: 'rgba(37,211,102,0.08)',
              color: '#25d366',
              fontSize: '0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}
          >
            📲 Compartilhar WhatsApp
          </button>
        </div>

        {/* Prize Info */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
              marginBottom: '0.25rem',
            }}
          >
            Estimativa Próximo Prêmio
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'white',
              fontFamily: 'var(--font-numbers)',
            }}
          >
            {result.valorEstimadoProximoConcurso
              ? new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(result.valorEstimadoProximoConcurso)
              : 'R$ --'}
          </div>
          {result.acumulado && (
            <div style={{ marginTop: '0.35rem' }}>
              <span
                style={{
                  background: 'rgba(255, 23, 68, 0.15)',
                  color: '#ff1744',
                  border: '1px solid #ff1744',
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                ACUMULOU!
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            paddingTop: '0.75rem',
          }}
        >
          <span>
            Próximo sorteio: <strong>{result.dataProximoConcurso}</strong>
          </span>
          {result.localSorteio && (
            <span>
              Local: <strong>{result.localSorteio}</strong>
            </span>
          )}
        </div>

        {/* Buscador de Concurso */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.03)',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Buscar outro Concurso (ex: 2600)..."
              value={customConcurso}
              onChange={(e) => setCustomConcurso(e.target.value)}
              className="search-input"
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                if (customConcurso) fetchResult(activeLottery, customConcurso);
              }}
              className="theme-pill-btn active"
              style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
            >
              🔍 Buscar
            </button>
            {result && history.length === 1 && (
              <button
                onClick={() => {
                  setCustomConcurso('');
                  fetchResult(activeLottery);
                }}
                className="theme-pill-btn"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 23, 68, 0.1)',
                  border: '1px solid #ff1744',
                  color: '#ff1744',
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Rateio Premiação Accordion */}
        {result.listaRateioPremio && result.listaRateioPremio.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => setShowRateio(!showRateio)}
              className="accordion-toggle"
            >
              <span>Detalhar Rateio de Ganhadores</span>
              <span>{showRateio ? '▲' : '▼'}</span>
            </button>
            {showRateio &&
              (() => {
                const rateios = result.listaRateioPremio ?? [];
                return (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      animation: 'scale-up 0.2s ease-out',
                    }}
                  >
                    {rateios.map((rateio, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.75rem',
                          borderBottom:
                            rIdx < rateios.length - 1
                              ? '1px solid rgba(255,255,255,0.03)'
                              : 'none',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background:
                                rateio.numeroDeGanhadores > 0
                                  ? config?.color || '#00ff88'
                                  : 'rgba(255,255,255,0.15)',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          >
                            {rateio.descricaoFaixa}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                              minWidth: '60px',
                              textAlign: 'center',
                            }}
                          >
                            {rateio.numeroDeGanhadores.toLocaleString()}{' '}
                            {rateio.numeroDeGanhadores === 1
                              ? 'ganhador'
                              : 'ganhadores'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              minWidth: '90px',
                              textAlign: 'right',
                              color:
                                rateio.numeroDeGanhadores > 0
                                  ? '#00e676'
                                  : 'rgba(255,255,255,0.2)',
                            }}
                          >
                            {rateio.valorPremio > 0
                              ? rateio.valorPremio.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })
                              : '---'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
          </div>
        )}
      </div>

      {/* Results History */}
      {history && history.length > 1 && (
        <div
          className="glass-panel"
          style={{ animation: 'fade-in 0.3s ease 0.1s' }}
        >
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <div className="panel-title">
              <span>📊</span> HISTÓRICO RECENTE
            </div>
            <span className="contest-badge">{history.length} concursos</span>
          </div>
          {/* Search bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por concurso, data ou número (ex: 2600, 01/01, 42)..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                outline: 'none',
              }}
            />
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
          >
            {filteredHistory.length === 0 && (
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '1rem',
                }}
              >
                Nenhum resultado encontrado para &ldquo;{historySearch}&rdquo;
              </p>
            )}
            {filteredHistory.map((histItem, hIdx) => (
              <div
                key={hIdx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    Concurso {histItem.numero}
                  </div>
                  <div
                    style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}
                  >
                    {histItem.dataApuracao}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {getCleanDezenas(histItem).map((d, dIdx) => (
                    <span
                      key={dIdx}
                      style={{
                        width:
                          activeLottery === 'loteriafederal' ? 'auto' : '20px',
                        minWidth:
                          activeLottery === 'loteriafederal' ? '40px' : '20px',
                        height: '20px',
                        borderRadius:
                          activeLottery === 'loteriafederal' ? '10px' : '50%',
                        padding:
                          activeLottery === 'loteriafederal' ? '0 4px' : '0',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${config.color}`,
                        color: 'white',
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
});
