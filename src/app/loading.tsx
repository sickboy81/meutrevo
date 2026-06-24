export default function Loading() {
  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#00f0ff',
          '--active-glow': 'rgba(0, 240, 255, 0.4)',
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
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(0, 240, 255, 0.2)',
            borderTopColor: '#00f0ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-body)',
            letterSpacing: '1px',
          }}
        >
          Carregando...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </main>
  );
}
