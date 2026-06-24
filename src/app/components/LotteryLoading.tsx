export default function LotteryLoading({ name }: { name: string }) {
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
      <div className="lottery-header">
        <div className="lottery-title-row">
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
          <div>
            <h1 className="lottery-title" style={{ opacity: 0.5 }}>
              {name}
            </h1>
            <p className="lottery-subtitle" style={{ opacity: 0.3 }}>
              Carregando resultados...
            </p>
          </div>
        </div>
      </div>
      <div
        className="lottery-content"
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '3rem',
        }}
      >
        <div
          style={{
            width: '200px',
            height: '24px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </main>
  );
}
