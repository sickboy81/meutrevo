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
  title: 'Lotomania - Resultados, Fechamentos & Estatísticas de Dezenas',
  description:
    'Veja o último resultado da Lotomania em tempo real, acesse estatísticas de dezenas e gere jogos baseados em fechamentos matemáticos e análise de soma de dezenas.',
  keywords: [
    'lotomania',
    'resultado lotomania',
    'gerador lotomania',
    'simulador lotomania',
    'fechamento lotomania',
    'probabilidade lotomania',
    'meu trevo lotomania',
  ],
  alternates: {
    canonical: '/lotomania',
  },
};

export default async function LotomaniaLanding() {
  const result = await getLatestLotteryResult('lotomania');

  const getCleanDezenas = (lotResult: LotteryResult) => {
    const list =
      lotResult.listaDezenas || lotResult.dezenasSorteadasOrdemSorteio || [];
    return [...list]
      .map((x) => parseInt(x, 10))
      .sort((a, b) => a - b)
      .map((x) => String(x).padStart(2, '0'));
  };

  const cleanDezenas = result
    ? getCleanDezenas(result).slice(0, 20)
    : [
        '04',
        '08',
        '15',
        '16',
        '23',
        '27',
        '32',
        '39',
        '42',
        '47',
        '50',
        '55',
        '61',
        '68',
        '72',
        '79',
        '84',
        '88',
        '91',
        '95',
      ];

  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#f7941d',
          '--active-glow': 'rgba(247, 148, 29, 0.4)',
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
                '@id': 'https://www.meutrevo.com/lotomania/#breadcrumb',
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
                    name: 'Lotomania',
                    item: 'https://www.meutrevo.com/lotomania',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Como funciona a Lotomania?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: "Na Lotomania, você escolhe 50 números na cartela de 100 disponíveis (00 a 99), e concorre a prêmios se acertar 15, 16, 17, 18, 19, 20 ou nenhum número. Trata-se da famosa loteria dos 'maníacos por jogos', devido à grande quantidade de faixas premiadas.",
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como o Meu Trevo ajuda a escolher 50 números na Lotomania?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Selecionar 50 dezenas manualmente é demorado e propenso a vícios cognitivos (como desenhar diagonais na cartela). O Meu Trevo utiliza algoritmos estatísticos que equilibram as dezenas por quadrante, paridade e somas matemáticas aproximadas da curva ideal (2200 a 2750), otimizando a aposta em segundos.',
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
              style={{ animationDuration: '1s', background: '#f7941d' }}
            >
              LOTOMANIA
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
            <span className="hero-preview-kicker" style={{ color: '#f7941d' }}>
              Loterias da Caixa
            </span>
            <h1
              className="landing-title"
              style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
            >
              Gerador e Estatísticas da Lotomania
            </h1>
            <p className="landing-hero-lead">
              Confira os números oficiais da Lotomania em tempo real, simule
              desdobramentos de 60 ou 70 dezenas e gere cartões com filtros
              inteligentes baseados em estatísticas históricas.
            </p>

            <div className="landing-proof-row" aria-label="Destaques Lotomania">
              <span>
                <strong>Média Geral</strong> 20 dezenas sorteadas
              </span>
              <span>
                <strong>Soma Ponderada</strong> 2200 a 2750
              </span>
              <span>
                <strong>Aposta Espelho</strong> simulação facilitada
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
                  background: '#f7941d',
                  border: 'none',
                }}
              >
                Começar no App Lotomania
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
            aria-label="Último concurso Lotomania"
          >
            <div className="hero-preview-header">
              <div>
                <span className="hero-preview-kicker">
                  Último Sorteio Oficial (20 primeiras dezenas)
                </span>
                <strong>
                  Concurso {result?.numero ? `#${result.numero}` : ''}
                </strong>
              </div>
              <span
                className="hero-preview-status"
                style={{ background: '#f7941d' }}
              >
                oficial
              </span>
            </div>
            <div
              className="hero-preview-balls"
              style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}
            >
              {cleanDezenas.map((num, i) => (
                <span
                  key={`${num}-${i}`}
                  style={{
                    background: '#f7941d',
                    width: '32px',
                    height: '32px',
                    fontSize: '0.85rem',
                  }}
                >
                  {num}
                </span>
              ))}
            </div>
            <div className="hero-preview-grid" style={{ marginTop: '1rem' }}>
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
                <span>Próximo Concurso</span>
                <strong>{result?.dataProximoConcurso || 'Em breve'}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section style={{ padding: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>📊</span> COMO O MEU TREVO OTIMIZA SEUS JOGOS DA LOTOMANIA
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            A chance de acertar as 20 dezenas com um jogo simples de 50 dezenas
            na Lotomania é de <strong>1 em 11.372.635</strong>. Contudo, devido
            à ampla faixa de premiações (acertos de 15 a 19 e 0 acertos), usar
            estratégias com base na análise matemática dos quadrantes é
            essencial.
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
                  background: 'rgba(247, 148, 29, 0.1)',
                  borderColor: 'rgba(247, 148, 29, 0.2)',
                  color: '#f7941d',
                }}
              >
                ⚖️
              </div>
              <div className="feature-info">
                <h3>Filtros de Paridade e Primos</h3>
                <p>
                  Mantenha a proporção ideal de dezenas pares e ímpares (em
                  torno de 25 pares e 25 ímpares) para manter o seu jogo
                  alinhado com a probabilidade real de repetição.
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
                ⚡
              </div>
              <div className="feature-info">
                <h3>Soma Esperada das Dezenas</h3>
                <p>
                  O Meu Trevo descarta automaticamente combinações com
                  distribuição muito irregular onde a soma fica muito acima ou
                  abaixo do intervalo estatístico padrão de 2200 a 2750.
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
                🪞
              </div>
              <div className="feature-info">
                <h3>Aposta Espelho</h3>
                <p>
                  Gere facilmente jogos espelho (que contêm as outras 50 dezenas
                  que não foram selecionadas no seu jogo principal) para
                  aumentar as chances nas faixas extremas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulator Client Component */}
        <div style={{ margin: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>⚙️</span> SIMULADOR EXPRESSO DA LOTOMANIA
          </h2>
          <QuickSimulator initialResult={result} initialLottery="lotomania" />
        </div>

        {/* Pricing / CTA Section */}
        <section
          style={{
            padding: '2rem 0',
            background: 'rgba(247, 148, 29, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(247, 148, 29, 0.15)',
            paddingBlock: '3rem',
            textAlign: 'center',
          }}
        >
          <h2
            style={{ fontSize: '2rem', color: 'white', marginBottom: '1rem' }}
          >
            Potencialize seus jogos da Lotomania
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
            }}
          >
            Use os filtros de repetição, simulação baseada em atrasômetro e
            exporte seus fechamentos de 50 dezenas de forma profissional com a
            nossa assinatura PRO.
          </p>
          <AppEntryLink
            className="landing-btn-primary"
            style={{
              textDecoration: 'none',
              background: '#f7941d',
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
