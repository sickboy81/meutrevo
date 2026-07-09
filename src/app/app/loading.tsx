export default function Loading() {
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
      }}
    >
      <span
        className="loader"
        style={
          {
            '--accent-color': '#209869',
          } as React.CSSProperties
        }
      />
      <p
        style={{
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
        }}
      >
        Carregando Meu Trevo...
      </p>
    </div>
  );
}
