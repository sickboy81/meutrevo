'use client';

interface TutorialModalProps {
  tutorialStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onNavigate: (
    tab:
      | 'results'
      | 'generator'
      | 'simulator'
      | 'stats'
      | 'finance'
      | 'admin'
      | 'profile',
    subTab?: string
  ) => void;
  playSound: (type: 'click' | 'success' | 'delete') => void;
}

export default function TutorialModal({
  tutorialStep,
  onNext,
  onPrev,
  onSkip,
  onNavigate,
  playSound,
}: TutorialModalProps) {
  const emojis = ['👋', '📊', '⚡', '👥', '🎯', '📈', '⚙️'];
  const titles = [
    'Bem-vindo ao Meu Trevo!',
    '1. Resultados da Caixa',
    '2. Geração Inteligente',
    '3. Bolão IA de Sucesso',
    '4. Simulador & Testador',
    '5. Análise de Tendências',
    '6. Customização & Temas',
  ];

  const contents = [
    <p key="0">
      O <strong>Meu Trevo</strong> é um assistente completo para analisar,
      simular e otimizar suas apostas lotéricas com matemática real. Vamos fazer
      um tour de 1 minuto pelos recursos?
    </p>,
    <p key="1">
      Na aba <strong>Resultados</strong>, acompanhe os últimos sorteios
      sincronizados com a Caixa. Digite o número do concurso no buscador para
      checar resultados históricos instantaneamente!
    </p>,
    <p key="2">
      Na aba <strong>Gerador</strong>, selecione a estratégia (Quentes,
      Atrasadas, Equilibradas) e a IA montará seus bilhetes. Fixe ou exclua
      dezenas direto no volante e ative regras matemáticas avançadas como evitar
      consecutivos!
    </p>,
    <p key="3">
      Deseja jogar em grupo? Na sub-aba <strong>Gerador Bolão</strong>, crie
      cartões homogêneos para dispersar os números e maximize as chances de
      cobertura total do prêmio.
    </p>,
    <p key="4">
      Na aba <strong>Simulador</strong>, marque dezenas no volante e simule a
      taxa de acerto contra concursos passados. Use também o{' '}
      <strong>Testador de Favoritos</strong> para verificar se seus números da
      sorte já ganharam prêmios!
    </p>,
    <p key="5">
      Na aba <strong>Estatísticas</strong>, explore gráficos SVG interativos
      neon de proporção par/ímpar, histogramas de dezenas e o gráfico de
      tendência temporal da evolução das somas.
    </p>,
    <p key="6">
      No ícone de <strong>Configurações (⚙️)</strong> no cabeçalho, ative
      efeitos sonoros sintetizados, configure alertas de resultados por e-mail e
      mude o estilo neon do app para Dracula, Cyberpunk, Matrix e mais!
    </p>,
  ];

  const handleNextClick = () => {
    playSound('click');
    if (tutorialStep < 6) {
      if (tutorialStep === 0) onNavigate('results');
      if (tutorialStep === 1) onNavigate('generator', 'smart');
      if (tutorialStep === 2) onNavigate('generator', 'bolao');
      if (tutorialStep === 3) onNavigate('simulator');
      if (tutorialStep === 4) onNavigate('stats');
      if (tutorialStep === 5) onNavigate('results');
      onNext();
    } else {
      onSkip();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-content-wrapper"
        style={{
          maxWidth: '400px',
          border: '2px solid var(--accent-color)',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}
      >
        <button className="modal-close-btn" onClick={onSkip}>
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '2rem' }}>{emojis[tutorialStep]}</span>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: 'white',
              marginTop: '0.25rem',
            }}
          >
            {titles[tutorialStep]}
          </h2>
          <div
            style={{
              height: '4px',
              width: '60px',
              background: 'var(--accent-color)',
              margin: '0.5rem auto 0 auto',
              borderRadius: '2px',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            lineHeight: 1.5,
            margin: '1rem 0',
            minHeight: '80px',
            textAlign: 'center',
          }}
        >
          {contents[tutorialStep]}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '0.75rem',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={onSkip}
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
          >
            Pular
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: 7 }).map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background:
                    tutorialStep === idx
                      ? 'var(--accent-color)'
                      : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {tutorialStep > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  playSound('click');
                  onPrev();
                }}
                style={{ fontSize: '0.7rem', padding: '0.35rem 0.6rem' }}
              >
                Voltar
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleNextClick}
              style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}
            >
              {tutorialStep === 6 ? 'Concluir!' : 'Avançar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
