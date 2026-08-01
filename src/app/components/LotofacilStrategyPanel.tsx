'use client';

import { startTransition, useState } from 'react';
import type { LotteryResult } from '../types';
import {
  generateLotofacilStrategy,
  runLotofacilRollingBacktest,
  type LotofacilBacktestResult,
  type LotofacilStrategyResult,
} from '@/lib/lotofacil-strategy';

type Props = {
  history: LotteryResult[];
  onSaveGame: (numbers: number[]) => void;
};

const hits = [11, 12, 13, 14, 15] as const;

function formatNumbers(numbers: number[]) {
  return numbers.map((number) => String(number).padStart(2, '0')).join(', ');
}

function formatAverage(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function LotofacilStrategyPanel({ history, onSaveGame }: Props) {
  const [strategy, setStrategy] = useState<LotofacilStrategyResult | null>(
    null
  );
  const [backtest, setBacktest] = useState<LotofacilBacktestResult | null>(
    null
  );
  const [generating, setGenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const usableDraws = history.filter(
    (draw) =>
      (draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || []).length ===
      15
  );

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      startTransition(() =>
        setStrategy(generateLotofacilStrategy(usableDraws))
      );
      setGenerating(false);
    }, 0);
  };

  const test = () => {
    setTesting(true);
    window.setTimeout(() => {
      startTransition(() =>
        setBacktest(runLotofacilRollingBacktest(usableDraws))
      );
      setTesting(false);
    }, 0);
  };

  return (
    <section aria-label="Estratégia Lotofácil" style={{ paddingTop: '0.5rem' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span style={{ color: '#f50057' }}>◆</span> ESTRATÉGIA LOTOFÁCIL
        </div>
        <span className="contest-badge">
          PRO · {usableDraws.length}/100 concursos
        </span>
      </div>
      <div
        style={{
          border: '1px solid rgba(245,0,87,0.25)',
          background:
            'linear-gradient(135deg, rgba(147,9,143,0.15), rgba(0,240,255,0.04))',
          borderRadius: '10px',
          padding: '0.75rem',
          marginBottom: '0.8rem',
          fontSize: '0.68rem',
          lineHeight: 1.5,
          color: 'var(--text-muted)',
        }}
      >
        <strong style={{ color: 'white' }}>
          Três jogos estruturados pela janela histórica carregada.
        </strong>{' '}
        Usa frequência completa e recente (100/30/10), atraso, moldura, grade
        5×5, soma, sequências, repetição do concurso anterior e pares/trincas.
        Não usa resultado futuro no backtest e não promete aumento de chance.
      </div>

      {usableDraws.length < 10 ? (
        <div
          style={{
            fontSize: '0.72rem',
            color: '#ffd600',
            padding: '0.7rem',
            borderRadius: '8px',
            background: 'rgba(255,214,0,0.08)',
          }}
        >
          Carregue pelo menos 10 concursos da Lotofácil para usar a estratégia.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.6rem',
              marginBottom: '0.85rem',
            }}
          >
            <button
              className="btn-action"
              onClick={generate}
              disabled={generating}
              style={{
                minHeight: '46px',
                fontSize: '0.72rem',
                opacity: generating ? 0.7 : 1,
              }}
            >
              {generating ? 'Calculando...' : 'Gerar 3 jogos'}
            </button>
            <button
              onClick={test}
              disabled={testing || usableDraws.length < 20}
              style={{
                minHeight: '46px',
                borderRadius: '8px',
                border: '1px solid rgba(245,0,87,0.45)',
                background: 'rgba(147,9,143,0.16)',
                color: '#f9a8d4',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: testing || usableDraws.length < 20 ? 0.6 : 1,
              }}
            >
              {testing ? 'Testando...' : 'Rodar backtest móvel'}
            </button>
          </div>

          {strategy && (
            <div
              style={{
                display: 'grid',
                gap: '0.55rem',
                marginBottom: '0.9rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  fontSize: '0.58rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>
                  Faixa de soma: {strategy.analysis.sumRange.min}-
                  {strategy.analysis.sumRange.max}
                </span>
                <span>
                  · Repetidas: {strategy.analysis.repeatRange.min}-
                  {strategy.analysis.repeatRange.max}
                </span>
                <span>· Moldura: 9-11</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '0.45rem',
                  fontSize: '0.56rem',
                }}
              >
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '7px',
                    background: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Frequência recente (30)
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      marginTop: '0.16rem',
                    }}
                  >
                    {Object.entries(strategy.analysis.frequencies.last30)
                      .sort(([, left], [, right]) => right - left)
                      .slice(0, 4)
                      .map(([number]) => String(number).padStart(2, '0'))
                      .join(' · ')}
                  </strong>
                </div>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '7px',
                    background: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Maiores atrasos
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      marginTop: '0.16rem',
                    }}
                  >
                    {Object.entries(strategy.analysis.delays)
                      .sort(([, left], [, right]) => right - left)
                      .slice(0, 4)
                      .map(([number]) => String(number).padStart(2, '0'))
                      .join(' · ')}
                  </strong>
                </div>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '7px',
                    background: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Linhas / colunas
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      marginTop: '0.16rem',
                    }}
                  >
                    {strategy.analysis.rowRange.min}-
                    {strategy.analysis.rowRange.max} /{' '}
                    {strategy.analysis.columnRange.min}-
                    {strategy.analysis.columnRange.max}
                  </strong>
                </div>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: '7px',
                    background: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    Sequências / pares
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      marginTop: '0.16rem',
                    }}
                  >
                    {strategy.analysis.sequenceRange.min}-
                    {strategy.analysis.sequenceRange.max} ·{' '}
                    {strategy.analysis.parity.even}/
                    {strategy.analysis.parity.odd}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.56rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Pares recorrentes:{' '}
                {strategy.analysis.topPairs
                  .slice(0, 3)
                  .map(
                    (pair) => `${formatNumbers(pair.numbers)} (${pair.count}x)`
                  )
                  .join(' · ')}
                <br />
                Trincas recorrentes:{' '}
                {strategy.analysis.topTriads
                  .slice(0, 2)
                  .map(
                    (triad) =>
                      `${formatNumbers(triad.numbers)} (${triad.count}x)`
                  )
                  .join(' · ')}
              </div>
              {strategy.games.map((game) => (
                <article
                  key={game.label}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '9px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.6rem',
                      alignItems: 'center',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <strong style={{ color: '#f9a8d4', fontSize: '0.72rem' }}>
                      {game.label}
                    </strong>
                    <button
                      onClick={() => onSaveGame(game.numbers)}
                      style={{
                        background: 'rgba(0,230,118,0.1)',
                        border: '1px solid rgba(0,230,118,0.25)',
                        color: '#00e676',
                        padding: '0.25rem 0.45rem',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.58rem',
                        fontWeight: 800,
                      }}
                    >
                      Salvar
                    </button>
                  </div>
                  <div
                    style={{
                      color: 'white',
                      fontFamily: 'var(--font-numbers)',
                      fontSize: '0.75rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {formatNumbers(game.numbers)}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.45rem',
                      marginTop: '0.35rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.56rem',
                    }}
                  >
                    <span>
                      {game.even} pares/{game.odd} ímpares
                    </span>
                    <span>
                      Moldura {game.border}, centro {game.center}
                    </span>
                    <span>Soma {game.sum}</span>
                    <span>Repete {game.repeats}</span>
                    <span>Sequência máx. {game.maxSequence}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {backtest && (
            <article
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(0,240,255,0.035)',
                border: '1px solid rgba(0,240,255,0.18)',
              }}
            >
              <strong
                style={{
                  color: '#00f0ff',
                  display: 'block',
                  fontSize: '0.72rem',
                  marginBottom: '0.35rem',
                }}
              >
                Backtest móvel: {backtest.contests} concursos avaliados
              </strong>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.55rem',
                  fontSize: '0.62rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Estratégia</span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.9rem',
                    }}
                  >
                    {formatAverage(backtest.strategy.averageHits)} acertos/jogo
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Aleatório</span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'white',
                      fontSize: '0.9rem',
                    }}
                  >
                    {formatAverage(backtest.random.averageHits)} acertos/jogo
                  </strong>
                </div>
              </div>
              <div
                style={{
                  marginTop: '0.55rem',
                  fontSize: '0.58rem',
                  color: 'var(--text-muted)',
                }}
              >
                {hits
                  .map(
                    (hit) =>
                      `${hit}: ${backtest.strategy.hits[hit]} vs ${backtest.random.hits[hit]}`
                  )
                  .join(' · ')}
              </div>
              <div
                style={{
                  marginTop: '0.55rem',
                  fontSize: '0.62rem',
                  color: backtest.statisticallyRelevant ? '#00e676' : '#ffd600',
                  lineHeight: 1.45,
                }}
              >
                Diferença média: {backtest.averageDifference >= 0 ? '+' : ''}
                {formatAverage(backtest.averageDifference)} · p=
                {backtest.pValue.toFixed(3)}. {backtest.conclusion}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}
