import { db } from '@/lib/db';
import Link from 'next/link';
import QuickSimulator from './QuickSimulator';

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
  } catch {
    // ignore
  }
  return null;
}

export interface LoteriaPageProps {
  lotteryId: string;
  name: string;
  color: string;
  glowColor: string;
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  fallbackNumbers: string[];
  probabilityText: string;
  sumRange: string;
  faq: { question: string; answer: string }[];
  features: { icon: string; title: string; description: string }[];
}

export default async function LoteriaLanding(props: LoteriaPageProps) {
  const result = await getCachedResult(props.lotteryId);

  const getCleanDezenas = (lotResult: LotteryResult) => {
    const list =
      lotResult.listaDezenas || lotResult.dezenasSorteadasOrdemSorteio || [];
    return [...list]
      .map((x) => parseInt(x, 10))
      .sort((a, b) => a - b)
      .map((x) => String(x).padStart(2, '0'));
  };

  const cleanDezenas = result ? getCleanDezenas(result) : props.fallbackNumbers;

  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': props.color,
          '--active-glow': props.glowColor,
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BreadcrumbList',
                '@id': `https://meutrevo.com.br${props.canonical}/#breadcrumb`,
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
                    name: props.name,
                    item: `https://meutrevo.com.br${props.canonical}`,
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: props.faq.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              },
            ],
          }),
        }}
      />

      <div className="landing-container animate-fade-in">
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
              {props.name.toUpperCase()}
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
                boxShadow: `0 0 10px ${props.glowColor}`,
                textDecoration: 'none',
              }}
            >
              Entrar no App ⚡
            </Link>
          </div>
        </header>

        <section className="landing-hero landing-hero-sales">
          <div className="landing-hero-copy">
            <span
              className="hero-preview-kicker"
              style={{ color: props.color }}
            >
              Loterias da Caixa
            </span>
            <h1
              className="landing-title"
              style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
            >
              {props.title}
            </h1>
            <p className="landing-hero-lead">{props.description}</p>

            <div
              className="landing-proof-row"
              aria-label={`Destaques ${props.name}`}
            >
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
                  background: props.color,
                  border: 'none',
                }}
              >
                Começar no App {props.name}
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
            aria-label={`Último concurso ${props.name}`}
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
                style={{ background: props.color }}
              >
                oficial
              </span>
            </div>
            <div className="hero-preview-balls">
              {cleanDezenas.map((num, i) => (
                <span key={`${num}-${i}`} style={{ background: props.color }}>
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
            {props.probabilityText}
          </p>
          <div
            className="landing-features-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {props.features.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div
                  className="feature-icon-wrapper"
                  style={{
                    background: `${props.glowColor.replace('0.4', '0.1')}`,
                    borderColor: props.glowColor.replace('0.4', '0.2'),
                    color: props.color,
                  }}
                >
                  {f.icon}
                </div>
                <div className="feature-info">
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ margin: '2rem 0' }}>
          <h2 className="landing-section-title">
            <span>⚙️</span> SIMULADOR EXPRESSO DA {props.name.toUpperCase()}
          </h2>
          <QuickSimulator
            initialResult={result}
            initialLottery={props.lotteryId}
          />
        </div>

        <section
          style={{
            padding: '2rem 0',
            background: `${props.glowColor.replace('0.4', '0.05')}`,
            borderRadius: '12px',
            border: `1px solid ${props.glowColor.replace('0.4', '0.15')}`,
            paddingBlock: '3rem',
            textAlign: 'center',
          }}
        >
          <h2
            style={{ fontSize: '2rem', color: 'white', marginBottom: '1rem' }}
          >
            Potencialize seus bolões da {props.name}
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
              background: props.color,
              border: 'none',
              padding: '0.8rem 2rem',
              fontSize: '1rem',
            }}
          >
            Assinar Meu Trevo Pro ⚡
          </Link>
        </section>

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
                    }}
                    className="hover-glow-text"
                  >
                    Lotomania
                  </Link>
                </li>
                <li>
                  <Link
                    href="/duplasena"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                    }}
                    className="hover-glow-text"
                  >
                    Dupla Sena
                  </Link>
                </li>
                <li>
                  <Link
                    href="/diadesorte"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                    }}
                    className="hover-glow-text"
                  >
                    Dia de Sorte
                  </Link>
                </li>
                <li>
                  <Link
                    href="/timemania"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                    }}
                    className="hover-glow-text"
                  >
                    Timemania
                  </Link>
                </li>
                <li>
                  <Link
                    href="/supersete"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                    }}
                    className="hover-glow-text"
                  >
                    Super Sete
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
