import {
  getLatestLotteryResult,
  type LotteryResult,
} from '@/lib/lottery-results';
import Link from 'next/link';
import AppEntryLink from '../components/AppEntryLink';
import QuickSimulator from '../components/QuickSimulator';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Quina - Resultados, Fechamentos & Gerador Estatístico',
  description:
    'Confira o último resultado da Quina em tempo real, use estatísticas de dezenas atrasadas/frequentes e faça desdobramentos combinatórios otimizados para suas apostas.',
  keywords: [
    'quina',
    'resultado quina',
    'gerador quina',
    'simulador quina',
    'fechamento quina',
    'probabilidade quina',
    'meu trevo quina',
  ],
  alternates: {
    canonical: '/quina',
  },
};

export default async function QuinaLanding() {
  const result = await getLatestLotteryResult('quina');

  const getCleanDezenas = (lotResult: LotteryResult) => {
    const list =
      lotResult.listaDezenas || lotResult.dezenasSorteadasOrdemSorteio || [];
    return [...list]
      .map((x) => parseInt(x, 10))
      .sort((a, b) => a - b)
      .map((x) => String(x).padStart(2, '0'));
  };

  const cleanDezenas = result
    ? getCleanDezenas(result)
    : ['16', '29', '44', '53', '78'];

  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#260085',
          '--active-glow': 'rgba(38, 0, 133, 0.4)',
        } as React.CSSProperties
      }
    >
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://www.meutrevo.com/quina/#breadcrumb',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Início',
                    item: 'https://www.meutrevo.com',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Quina',
                    item: 'https://www.meutrevo.com/quina',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Quantos números preciso acertar para ganhar na Quina?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A Quina premia apostas que acertam 2 (Duque), 3 (Terno), 4 (Quadra) ou 5 números (Quina). As faixas menores possuem probabilidades significativamente mais altas e são ideais para otimização com fechamentos.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funcionam os fechamentos da Quina?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Um fechamento de Quina permite que você selecione, por exemplo, 10 dezenas, e gere apenas as combinações necessárias de 5 números para garantir matematicamente o Terno ou a Quadra caso as 5 dezenas sorteadas estejam dentro do seu grupo de 10.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <div className="landing-container animate-fade-in">
        {/* Navigation / Header */}
        <header className="landing-header">
          <div className="logo-container">
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.8))',
                }}
              >
                <path
                  d="M12 12c0 3.5 1 6.5 2.5 8"
                  stroke="#00ff88"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <g
                  fill="#00ff88"
                  stroke="#00ff88"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fillOpacity="0.2"
                >
                  <path d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z" />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(90 12 12)"
                  />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(180 12 12)"
                  />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(270 12 12)"
                  />
                </g>
              </svg>
              <span
                className="logo-text"
                style={{
                  fontSize: '1.4rem',
                  textShadow: '0 0 10px var(--accent-glow)',
                }}
              >
                Meu Trevo
              </span>
            </Link>
            <span
              className="badge-live"
              style={{ animationDuration: '1s', background: '#260085' }}
            >
              QUINA
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              Voltar
            </Link>
            <AppEntryLink
              className="theme-pill-btn active"
              style={{
                fontSize: '0.8rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px var(--accent-glow)',
                textDecoration: 'none',
              }}
            >
              Entrar no App ⚡
            </AppEntryLink>
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero landing-hero-sales">
          <div className="landing-hero-copy">
            <span className="hero-preview-kicker" style={{ color: '#2979ff' }}>
              Loterias da Caixa
            </span>
            <h1
              className="landing-title"
              style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
            >
              Gerador e Estatísticas da Quina
            </h1>
            <p className="landing-hero-lead">
              Confira os últimos números sorteados na Quina, analise a
              distribuição de quadrantes e gere palpites de forma científica
              para concursos diários.
            </p>
            {result?.statusNotice && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.95rem 1rem',
                  borderRadius: '14px',
                  background: 'rgba(255, 214, 0, 0.08)',
                  border: '1px solid rgba(255, 214, 0, 0.22)',
                  color: '#ffe082',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.35rem',
                  }}
                >
                  <strong style={{ color: '#fff' }}>
                    {result.statusNotice.title}
                  </strong>
                  <span
                    style={{
                      borderRadius: '999px',
                      padding: '0.22rem 0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'rgba(255, 214, 0, 0.14)',
                      border: '1px solid rgba(255, 214, 0, 0.28)',
                      color: '#fff176',
                    }}
                  >
                    {result.statusNotice.badge}
                  </span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.55 }}>
                  {result.statusNotice.message}
                </p>
                {result.statusNotice.officialUrl && (
                  <a
                    href={result.statusNotice.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '0.55rem',
                      color: '#fff176',
                      textDecoration: 'underline',
                    }}
                  >
                    Acompanhar comunicado oficial da CAIXA
                  </a>
                )}
              </div>
            )}

            <div className="landing-proof-row" aria-label="Destaques Quina">
              <span>
                <strong>Concursos Diários</strong> acompanhamento
              </span>
              <span>
                <strong>Soma Ponderada</strong> 140 a 260
              </span>
              <span>
                <strong>Redução</strong> de volantes redundantes
              </span>
            </div>

            <div className="landing-cta-group landing-hero-actions">
              <AppEntryLink
                className="landing-btn-primary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#260085',
                  border: 'none',
                }}
              >
                Começar no App Quina
              </AppEntryLink>
              <Link
                href="/"
                className="landing-btn-secondary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                Ver Loterias
              </Link>
            </div>
          </div>

          <div
            className="landing-hero-preview"
            aria-label="Último concurso Quina"
          >
            <div className="hero-preview-header">
              <div>
                <span className="hero-preview-kicker">
                  Último Sorteio Oficial
                </span>
                <strong>
                  Concurso {result?.numero ? `#${result.numero}` : ''}
                </strong>
              </div>
              <span
                className="hero-preview-status"
                style={{ background: '#260085' }}
              >
                oficial
              </span>
            </div>
            <div className="hero-preview-balls">
              {cleanDezenas.map((num, i) => (
                <span key={`${num}-${i}`} style={{ background: '#260085' }}>
                  {num}
                </span>
              ))}
            </div>
            <div className="hero-preview-grid">
              <div>
                <span>Estimativa de Prêmio</span>
                <strong>
                  {result?.valorEstimadoProximoConcurso
                    ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(result.valorEstimadoProximoConcurso)
                    : 'R$ ---'}
                </strong>
              </div>
              <div>
                <span>Status Atual</span>
                <strong>{result?.acumulado ? 'Acumulado' : 'Premiado'}</strong>
              </div>
              <div>
                <span>Data do Concurso</span>
                <strong>{result?.dataApuracao || 'Recente'}</strong>
              </div>
              <div>
                <span>
                  {result?.statusNotice
                    ? 'Concurso Especial'
                    : 'Próximo Concurso'}
                </span>
                <strong>
                  {result?.statusNotice
                    ? `#${result.numeroConcursoProximo ?? result.numero + 1}`
                    : result?.dataProximoConcurso || 'Em breve'}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section style={{ padding: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>📊</span> COMO ANALISAR E MONTAR JOGOS DA QUINA
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            A Quina possui 80 dezenas na cartela e são sorteadas 5 dezenas por
            concurso. A chance de acertar as 5 dezenas com um jogo simples é de{' '}
            <strong>1 em 24.040.016</strong>. Com sorteios de segunda a sábado,
            ela exige agilidade e acompanhamento diário dos ciclos das dezenas.
          </p>

          <div
            className="landing-features-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <div className="landing-feature-card">
              <div
                className="feature-icon-wrapper"
                style={{
                  background: 'rgba(38, 0, 133, 0.1)',
                  borderColor: 'rgba(38, 0, 133, 0.2)',
                  color: '#260085',
                }}
              >
                🧬
              </div>
              <div className="feature-info">
                <h3>Filtro de Primos e Fibonacci</h3>
                <p>
                  Mantenha dezenas primas entre 1 e 3 e dezenas Fibonacci entre
                  0 e 2 em cada cartão de 5 números para acompanhar o padrão
                  histórico.
                </p>
              </div>
            </div>
            <div className="landing-feature-card">
              <div
                className="feature-icon-wrapper"
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  borderColor: 'rgba(0, 240, 255, 0.2)',
                  color: '#00f0ff',
                }}
              >
                ⊞
              </div>
              <div className="feature-info">
                <h3>Quadrantes Equilibrados</h3>
                <p>
                  Evite concentrar seus números em apenas um canto da cartela.
                  Nosso gerador distribui as dezenas homogeneamente entre os 4
                  quadrantes.
                </p>
              </div>
            </div>
            <div className="landing-feature-card">
              <div
                className="feature-icon-wrapper"
                style={{
                  background: 'rgba(255, 0, 127, 0.1)',
                  borderColor: 'rgba(255, 0, 127, 0.2)',
                  color: '#ff007f',
                }}
              >
                ⚡
              </div>
              <div className="feature-info">
                <h3>Soma Esperada</h3>
                <p>
                  Historicamente, a soma dos 5 números da Quina se concentra na
                  faixa de 140 a 260. Descarte combinações improváveis que fogem
                  dessa curva.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulator Client Component */}
        <div style={{ margin: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>⚙️</span> SIMULADOR EXPRESSO DA QUINA
          </h2>
          <QuickSimulator initialResult={result} initialLottery="quina" />
        </div>

        {/* Pricing / CTA Section */}
        <section
          style={{
            padding: '2rem 0',
            background: 'rgba(38, 0, 133, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(38, 0, 133, 0.15)',
            paddingBlock: '3rem',
            textAlign: 'center',
          }}
        >
          <h2
            style={{ fontSize: '2rem', color: 'white', marginBottom: '1rem' }}
          >
            Apoio completo para bolões da Quina
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
            }}
          >
            Acesse as ferramentas premium de geração e exportação de bolões
            otimizados e ciclos estatísticos da Quina no Meu Trevo Pro.
          </p>
          <AppEntryLink
            className="landing-btn-primary"
            style={{
              textDecoration: 'none',
              background: '#260085',
              border: 'none',
              padding: '0.8rem 2rem',
              fontSize: '1rem',
            }}
          >
            Assinar Meu Trevo Pro ⚡
          </AppEntryLink>
        </section>

        {/* Premium Footer */}
        <footer
          className="landing-footer"
          style={{
            borderTop: '1px solid var(--glass-border)',
            marginTop: '4rem',
            padding: '3rem 1.5rem 2rem 1.5rem',
            background:
              'linear-gradient(180deg, rgba(8, 8, 15, 0) 0%, rgba(10, 10, 25, 0.85) 100%)',
            borderRadius: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '2rem',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <div style={{ flex: '1 1 300px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.8))',
                }}
              >
                <path
                  d="M12 12c0 3.5 1 6.5 2.5 8"
                  stroke="#00ff88"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <g
                  fill="#00ff88"
                  stroke="#00ff88"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fillOpacity="0.2"
                >
                  <path d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z" />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(90 12 12)"
                  />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(180 12 12)"
                  />
                  <path
                    d="M12 12 C 10.5 9.5, 8.5 9.5, 8.5 7.5 C 8.5 5.5, 10.5 5.5, 12 7.5 C 13.5 5.5, 15.5 5.5, 15.5 7.5 C 15.5 9.5, 13.5 9.5, 12 12 Z"
                    transform="rotate(270 12 12)"
                  />
                </g>
              </svg>
              <div
                className="logo-text"
                style={{
                  fontSize: '1.4rem',
                  textShadow: '0 0 12px var(--accent-glow)',
                }}
              >
                Meu Trevo
              </div>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '0.75rem',
                maxWidth: '320px',
                lineHeight: 1.6,
              }}
            >
              Inteligência estatística, combinatória matemática avançada e
              análise histórica em tempo real para otimizar seus jogos de
              loteria de forma inteligente.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
            <div>
              <h4
                style={{
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Modalidades
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                <li>
                  <Link
                    href="/megasena"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Mega-Sena
                  </Link>
                </li>
                <li>
                  <Link
                    href="/lotofacil"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Lotofácil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quina"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Quina
                  </Link>
                </li>
                <li>
                  <Link
                    href="/lotomania"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Lotomania
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                style={{
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Meu Trevo
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                <li>
                  <Link
                    href="/"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Página Inicial
                  </Link>
                </li>
                <li>
                  <AppEntryLink
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Entrar no App ⚡
                  </AppEntryLink>
                </li>
                <li>
                  <Link
                    href="/terms"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div
            style={{
              width: '100%',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '1.5rem',
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              &copy; {new Date().getFullYear()} Meu Trevo. Todos os direitos
              reservados.
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Feito com ⚡ para apostadores estatísticos.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
