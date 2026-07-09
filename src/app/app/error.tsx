'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '2rem' }}>⚠️</p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: 'var(--text-main)',
        }}
      >
        Algo deu errado
      </h2>
      <p
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          maxWidth: '300px',
        }}
      >
        {error.message || 'Erro inesperado. Tente novamente.'}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--accent-color, #209869)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
