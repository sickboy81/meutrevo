import { db, isMissingDbEnvError } from '@/lib/db';
import Link from 'next/link';
import QuickSimulator from '../components/QuickSimulator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mega-Sena - Resultados, Estatísticas & Gerador Inteligente',
  description:
    'Confira o último resultado da Mega-Sena em tempo real, use nosso gerador de dezenas estatístico e faça fechamentos matemáticos otimizados para acumular mais acertos.',
  keywords: [
    'mega sena',
    'resultado mega sena',
    'gerador mega sena',
    'simulador mega sena',
    'fechamento mega sena',
    'probabilidade mega sena',
    'meu trevo mega sena',
  ],
  alternates: {
    canonical: '/megasena',
  },
};

interface LotteryResult {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  dezenasSorteadasOrdemSorteio: string[];
  listaDezenas: string[];
  trevosSorteados?: string[];
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  nomeMunicipioUFSorteio?: string;
  localSorteio?: string;
  listaRateioPremio?: {
    descricaoFaixa: string;
    faixa: number;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
}

async function getCachedResult(
  lotteryId: string
): Promise<LotteryResult | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT data_json FROM lottery_cache WHERE lottery = ? ORDER BY contest_num DESC LIMIT 1',
      args: [lotteryId],
    });
    if (res.rows.length > 0) {
      return JSON.parse(res.rows[0].data_json as string) as LotteryResult;
    }
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(`Failed to fetch cache for ${lotteryId}:`, e);
    }
  }
  return null;
}

export default async function MegaSenaLanding() {
  const result = await getCachedResult('megasena');

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
    : ['02', '11', '25', '37', '41', '58'];

  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#209869',
          '--active-glow': 'rgba(32, 152, 105, 0.4)',
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
                '@id': 'https://meutrevo.com.br/megasena/#breadcrumb',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Início',
                    item: 'https://meutrevo.com.br',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Mega-Sena',
                    item: 'https://meutrevo.com.br/megasena',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Como aumentar minhas chances na Mega-Sena?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A forma mais eficiente matematicamente é o fechamento combinatório. Ao invés de fazer apostas aleatórias, você seleciona um grupo maior de dezenas e o Meu Trevo distribui essas dezenas em cartões que garantem prêmios menores (como quadra ou quina) se as condições forem atendidas, barateando o custo total do jogo.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Qual é a soma ideal para jogos da Mega-Sena?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Estatisticamente, a maioria dos sorteios da Mega-Sena tem a soma total de suas 6 dezenas entre 120 e 240. Gerar cartões dentro dessa faixa de soma elimina jogos altamente improváveis, como sequências consecutivas puras.',
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
            <span className="badge-live" style={{ animationDuration: '1s' }}>
              MEGA-SENA
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
            <Link
              href="/app"
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
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero landing-hero-sales">
          <div className="landing-hero-copy">
            <span className="hero-preview-kicker" style={{ color: '#209869' }}>
              Loterias da Caixa
            </span>
            <h1
              className="landing-title"
              style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
            >
              Gerador e Estatísticas da Mega-Sena
            </h1>
            <p className="landing-hero-lead">
              Acompanhe resultados, simule dezenas históricas e use fechamentos
              combinatórios matemáticos para potencializar seus jogos na
              principal loteria do Brasil.
            </p>

            <div className="landing-proof-row" aria-label="Destaques Mega-Sena">
              <span>
                <strong>Probabilidade</strong> tabelada
              </span>
              <span>
                <strong>Filtros</strong> estatísticos avançados
              </span>
              <span>
                <strong>Frequência</strong> de dezenas
              </span>
            </div>

            <div className="landing-cta-group landing-hero-actions">
              <Link
                href="/app"
                className="landing-btn-primary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#209869',
                  border: 'none',
                }}
              >
                Começar no App Mega
              </Link>
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
            aria-label="Último concurso Mega-Sena"
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
                style={{ background: '#209869' }}
              >
                oficial
              </span>
            </div>
            <div className="hero-preview-balls">
              {cleanDezenas.map((num, i) => (
                <span key={`${num}-${i}`} style={{ background: '#209869' }}>
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
                <span>Próximo Concurso</span>
                <strong>{result?.dataProximoConcurso || 'Em breve'}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section style={{ padding: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>📊</span> ANÁLISE MATEMÁTICA E PROBABILIDADES
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            A Mega-Sena possui 60 dezenas disponíveis na cartela, onde são
            sorteadas 6 dezenas. A chance de acertar a Sena com uma aposta
            simples de 6 números é de exatamente{' '}
            <strong>1 em 50.063.860</strong>. Com o Meu Trevo, você pode
            analisar as tendências estatísticas dos números mais atrasados e
            quentes antes de formular sua estratégia.
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
                  background: 'rgba(32, 152, 105, 0.1)',
                  borderColor: 'rgba(32, 152, 105, 0.2)',
                  color: '#209869',
                }}
              >
                📊
              </div>
              <div className="feature-info">
                <h3>Frequência e Atrasômetro</h3>
                <p>
                  Monitore quais números saem com mais regularidade nas últimas
                  dezenas e quais estão em maior período de atraso para
                  equilibrar seus palpites.
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
                <h3>Soma Ponderada</h3>
                <p>
                  Mantenha a soma total das suas dezenas entre 120 e 240, que é
                  a região de maior concentração de probabilidade segundo a lei
                  dos grandes números.
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
                🔮
              </div>
              <div className="feature-info">
                <h3>Fechamentos / Desdobramentos</h3>
                <p>
                  Gere cartões otimizados que garantem Quadra ou Quina caso você
                  acerte as dezenas dentro de um grupo maior escolhido por você.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulator Client Component */}
        <div style={{ margin: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>⚙️</span> SIMULADOR EXPRESSO DA MEGA-SENA
          </h2>
          <QuickSimulator initialResult={result} initialLottery="megasena" />
        </div>

        {/* Pricing / CTA Section */}
        <section
          style={{
            padding: '2rem 0',
            background: 'rgba(32, 152, 105, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(32, 152, 105, 0.15)',
            paddingBlock: '3rem',
            textAlign: 'center',
          }}
        >
          <h2
            style={{ fontSize: '2rem', color: 'white', marginBottom: '1rem' }}
          >
            Potencialize seus bolões da Mega-Sena
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
            }}
          >
            Acesse ferramentas avançadas de exportação para TXT, simulador de
            estratégias com dados reais históricos e geração de fechamentos
            simplificados no painel PRO.
          </p>
          <Link
            href="/app"
            className="landing-btn-primary"
            style={{
              textDecoration: 'none',
              background: '#209869',
              border: 'none',
              padding: '0.8rem 2rem',
              fontSize: '1rem',
            }}
          >
            Assinar Meu Trevo Pro ⚡
          </Link>
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
                  <Link
                    href="/app"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Entrar no App ⚡
                  </Link>
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
