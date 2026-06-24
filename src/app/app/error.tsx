'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro no app:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
      <h1
        style={{
          color: '#ff1744',
          fontSize: '1.5rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 'bold',
        }}
      >
        Erro no Painel
      </h1>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          maxWidth: '400px',
          lineHeight: 1.6,
        }}
      >
        Não foi possível carregar o painel. Verifique sua conexão e tente
        novamente.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          onClick={reset}
          style={{
            background: 'var(--accent-color)',
            color: '#000',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--glass-border)',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Página Inicial
        </Link>
      </div>
    </div>
  );
}
