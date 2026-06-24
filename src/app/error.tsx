'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na página:', error);
  }, [error]);

  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#ff1744',
          '--active-glow': 'rgba(255, 23, 68, 0.4)',
        } as React.CSSProperties
      }
    >
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
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '0.5rem',
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            color: '#ff1744',
            fontSize: '1.5rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 'bold',
          }}
        >
          Algo deu errado
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          Ocorreu um erro inesperado. Por favor, tente novamente ou volte para a
          página inicial.
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
    </main>
  );
}
