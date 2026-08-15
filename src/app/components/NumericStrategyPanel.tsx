'use client';

import { startTransition, useState } from 'react';
import type { LotteryResult } from '../types';
import type { LotteryConfig } from '@/lib/lottery-math';
import {
  generateNumericStrategy,
  runNumericRollingBacktest,
  type NumericBacktestResult,
  type NumericStrategyResult,
} from '@/lib/numeric-lottery-strategy';

type Props = {
  history: LotteryResult[];
  config: LotteryConfig;
  onSaveGame: (numbers: number[]) => void;
  onGeneratedGame?: (games: number[][]) => void;
};

function numbersText(numbers: number[]) {
  return numbers.map((number) => String(number).padStart(2, '0')).join(', ');
}

function decimal(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function NumericStrategyPanel({
  history,
  config,
  onSaveGame,
  onGeneratedGame,
}: Props) {
  const [strategy, setStrategy] = useState<NumericStrategyResult | null>(null);
  const [backtest, setBacktest] = useState<NumericBacktestResult | null>(null);
  const [busy, setBusy] = useState<'generate' | 'test' | null>(null);
  const usableHistory = history.filter(
    (draw) =>
      (draw.listaDezenas || draw.dezenasSorteadasOrdemSorteio || []).length ===
      config.drawCount
  );

  const runGeneration = () => {
    setBusy('generate');
    window.setTimeout(() => {
      startTransition(() => {
        const result = generateNumericStrategy(usableHistory, config);
        setStrategy(result);
        if (result) onGeneratedGame?.(result.games.map((game) => game.numbers));
      });
      setBusy(null);
    }, 0);
  };

  const runTest = () => {
    setBusy('test');
    window.setTimeout(() => {
      startTransition(() =>
        setBacktest(runNumericRollingBacktest(usableHistory, config))
      );
      setBusy(null);
    }, 0);
  };

  return (
    <section
      aria-label={`Estratégia avançada ${config.name}`}
      style={{ paddingTop: '0.5rem' }}
    >
      <div className="panel-header">
        <div className="panel-title">
          <span style={{ color: config.accentColor }}>◆</span> ESTRATÉGIA{' '}
          {config.name.toUpperCase()}
        </div>
        <span className="contest-badge">
          PRO · {usableHistory.length}/100 concursos
        </span>
      </div>
      <div
        style={{
          padding: '0.75rem',
          marginBottom: '0.8rem',
          borderRadius: '10px',
          border: `1px solid ${config.accentColor}55`,
          background: `${config.color}18`,
          color: 'var(--text-muted)',
          fontSize: '0.68rem',
          lineHeight: 1.5,
        }}
      >
        Gera três jogos com frequência completa e recente, atraso, soma,
        paridade, repetição, sequências, distribuição por linhas/colunas e
        pares/trincas. As regras são adaptadas ao formato de {config.name}; não
        há promessa de aumento de chance.
      </div>
      {usableHistory.length < 10 ? (
        <div
          style={{
            padding: '0.7rem',
            borderRadius: '8px',
            color: '#ffd600',
            background: 'rgba(255,214,0,0.08)',
            fontSize: '0.72rem',
          }}
        >
          Carregue pelo menos 10 concursos para usar a estratégia.
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
              onClick={runGeneration}
              disabled={busy !== null}
              style={{ minHeight: '46px', fontSize: '0.72rem' }}
            >
              {busy === 'generate' ? 'Calculando...' : 'Gerar 3 jogos'}
            </button>
            <button
              onClick={runTest}
              disabled={busy !== null || usableHistory.length < 20}
              style={{
                minHeight: '46px',
                borderRadius: '8px',
                border: `1px solid ${config.accentColor}66`,
                background: `${config.color}28`,
                color: config.accentColor,
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: usableHistory.length < 20 ? 0.6 : 1,
              }}
            >
              {busy === 'test' ? 'Testando...' : 'Rodar backtest móvel'}
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
                  gap: '0.4rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.58rem',
                }}
              >
                <span>
                  Soma: {strategy.analysis.sumRange.min}-
                  {strategy.analysis.sumRange.max}
                </span>
                <span>
                  Repetição: {strategy.analysis.repeatRange.min}-
                  {strategy.analysis.repeatRange.max}
                </span>
                <span>
                  Pares: {strategy.analysis.evenRange.min}-
                  {strategy.analysis.evenRange.max}
                </span>
                <span>
                  Linhas/colunas máx.: {strategy.analysis.rowRange.max}/
                  {strategy.analysis.columnRange.max}
                </span>
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.56rem',
                  lineHeight: 1.5,
                }}
              >
                Pares recorrentes:{' '}
                {strategy.analysis.topPairs
                  .slice(0, 3)
                  .map(
                    (pair) => `${numbersText(pair.numbers)} (${pair.count}x)`
                  )
                  .join(' · ')}
                <br />
                Trincas recorrentes:{' '}
                {strategy.analysis.topTriads
                  .slice(0, 2)
                  .map(
                    (triad) => `${numbersText(triad.numbers)} (${triad.count}x)`
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
                    <strong
                      style={{ color: config.accentColor, fontSize: '0.72rem' }}
                    >
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
                    {numbersText(game.numbers)}
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
                    <span>Soma {game.sum}</span>
                    <span>Repete {game.repeats}</span>
                    <span>Seq. máx. {game.maxSequence}</span>
                    <span>
                      Linhas/colunas {game.rows}/{game.columns}
                    </span>
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
                background: `${config.color}12`,
                border: `1px solid ${config.accentColor}44`,
              }}
            >
              <strong
                style={{
                  display: 'block',
                  marginBottom: '0.35rem',
                  color: config.accentColor,
                  fontSize: '0.72rem',
                }}
              >
                Backtest móvel: {backtest.contests} concursos
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
                    {decimal(backtest.strategyAverage)}
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
                    {decimal(backtest.randomAverage)}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  marginTop: '0.5rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.58rem',
                }}
              >
                Faixas altas: estratégia{' '}
                {JSON.stringify(backtest.strategyBands)} · aleatório{' '}
                {JSON.stringify(backtest.randomBands)}
              </div>
              <div
                style={{
                  marginTop: '0.55rem',
                  color: backtest.statisticallyRelevant ? '#00e676' : '#ffd600',
                  fontSize: '0.62rem',
                  lineHeight: 1.45,
                }}
              >
                Diferença média: {backtest.difference >= 0 ? '+' : ''}
                {decimal(backtest.difference)} · p={backtest.pValue.toFixed(3)}.{' '}
                {backtest.conclusion}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}
