'use client';

import Link from 'next/link';
import type { StrategyCatalogEntry } from '@/lib/strategy-catalog';

type Props = { entry: StrategyCatalogEntry };

export default function StrategyWorkspace({ entry }: Props) {
  return (
    <main
      className="landing-shell"
      style={{ maxWidth: 1120, margin: '0 auto', padding: '2rem 1rem' }}
    >
      <Link href="/" className="theme-pill-btn">
        Voltar ao inicio
      </Link>
      <header style={{ margin: '2rem 0' }}>
        <p style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
          ESTRATEGIA POR MODALIDADE
        </p>
        <h1>{entry.name}: estrategia historica explicavel</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 760 }}>
          {entry.shortDescription}
        </p>
      </header>
      <section
        className="strategy-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: '1rem',
        }}
      >
        <article className="glass-card">
          <h2>O que analisamos</h2>
          <ul>
            {entry.analyzed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="glass-card">
          <h2>O que nao afirmamos</h2>
          <ul>
            {entry.notAnalyzed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="glass-card">
          <h2>Como funciona</h2>
          <ol>
            {entry.method.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </section>
      <section className="glass-card" style={{ marginTop: '1rem' }}>
        <h2>Exemplo pratico</h2>
        <p>{entry.example}</p>
        <h2>Backtest e limites</h2>
        <p>{entry.backtest}</p>
        <p style={{ color: 'var(--text-muted)' }}>
          Dados historicos descrevem o passado. Nenhuma estrategia altera a
          probabilidade matematica do sorteio.
        </p>
        <Link
          href={`/app?lottery=${entry.id}&tab=generator`}
          className="primary-btn"
          style={{ display: 'inline-block', marginTop: '0.5rem' }}
        >
          Planejar jogo de {entry.name}
        </Link>
      </section>
    </main>
  );
}
