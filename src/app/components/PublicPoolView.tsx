'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Pool = {
  lottery: string;
  title: string;
  games: string[][];
  totalCost: number;
  quotasTotal: number;
  quotasTaken: number;
  organizationFee: number;
  status: string;
};

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function PublicPoolView({ shareCode }: { shareCode: string }) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/boloes/public/${encodeURIComponent(shareCode)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Bolão não encontrado.');
        setPool(data.bolao);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar o bolão.'
        )
      );
  }, [shareCode]);

  if (error)
    return (
      <section className="glass-card" style={{ marginTop: '2rem' }}>
        <h1>Bolão indisponível</h1>
        <p>{error}</p>
      </section>
    );
  if (!pool)
    return (
      <section className="glass-card" style={{ marginTop: '2rem' }}>
        <h1>Bolão compartilhado</h1>
        <p>Carregando resumo seguro...</p>
      </section>
    );

  return (
    <section className="glass-card" style={{ marginTop: '2rem' }}>
      <p style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
        CONFERÊNCIA COLETIVA
      </p>
      <h1>{pool.title || 'Bolão compartilhado'}</h1>
      <div className="metric-grid">
        <div>
          <strong>{pool.lottery}</strong>
          <span>modalidade</span>
        </div>
        <div>
          <strong>{pool.games.length}</strong>
          <span>jogos</span>
        </div>
        <div>
          <strong>{money.format(pool.totalCost)}</strong>
          <span>custo total</span>
        </div>
        <div>
          <strong>
            {pool.quotasTaken}/{pool.quotasTotal}
          </strong>
          <span>cotas ocupadas</span>
        </div>
      </div>
      <ol style={{ display: 'grid', gap: '0.45rem', paddingLeft: '1.2rem' }}>
        {pool.games.map((game, index) => (
          <li key={`${index}-${game.join('-')}`}>
            <code>{game.join(' - ')}</code>
          </li>
        ))}
      </ol>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Taxa de organização informada: {pool.organizationFee}% · O resumo não
        expõe dados pessoais.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(`/bolao/${shareCode}`)}`}
        className="primary-btn"
        style={{ display: 'inline-block', marginTop: '0.75rem' }}
      >
        Entrar para participar
      </Link>
    </section>
  );
}
