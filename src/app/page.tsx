import { db, isMissingDbEnvError } from '@/lib/db';
import Link from 'next/link';
import QuickSimulator from './components/QuickSimulator';

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

async function getPriceConfig(
  key: string,
  defaultValue: number
): Promise<number> {
  try {
    const res = await db.execute({
      sql: 'SELECT value FROM app_config WHERE key = ? LIMIT 1',
      args: [key],
    });
    if (res.rows.length > 0) {
      return parseFloat(res.rows[0].value as string) || defaultValue;
    }
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error(`Failed to fetch config ${key}:`, e);
    }
  }
  return defaultValue;
}

export default async function LandingHome() {
  const result = await getCachedResult('megasena');
  const priceMonthly = await getPriceConfig('price_monthly', 14.9);

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
    : ['09', '18', '26', '31', '53', '58'];

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
                '@type': 'WebSite',
                '@id': 'https://www.meutrevo.com/#website',
                url: 'https://www.meutrevo.com',
                name: 'Meu Trevo',
                description:
                  'Resultados em tempo real e gerador de dezenas estatístico para loterias do Brasil.',
                publisher: {
                  '@id': 'https://www.meutrevo.com/#organization',
                },
                inLanguage: 'pt-BR',
              },
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://www.meutrevo.com/#software',
                name: 'Meu Trevo',
                url: 'https://www.meutrevo.com',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: priceMonthly.toFixed(2),
                  priceCurrency: 'BRL',
                },
                description:
                  'Assistente Lotérico Inteligente com desdobramentos combinatórios matemáticos e análises estatísticas em tempo real das loterias da Caixa.',
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'O Meu Trevo garante que eu vou ganhar na loteria?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Não. Loterias são jogos baseados em aleatoriedade pura e sorte. Nenhuma ferramenta pode prever os números que vão sair. O Meu Trevo utiliza estatística histórica real e análise combinatória para otimizar suas apostas, permitindo que você cubra mais números com menos cartões de forma matemática.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funcionam os desdobramentos (fechamentos)?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'O desdobramento combinatório seleciona jogos específicos dentro de um grupo de números escolhidos. Por exemplo, em vez de pagar por todas as combinações de 10 números (o que seria extremamente caro), o algoritmo seleciona um conjunto otimizado de cartões simples que garante 100% de chance de Quadra se pelo menos 4 dos sorteados estiverem no seu grupo.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Como funciona a assinatura PRO e a ativação?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A ativação é 100% automatizada. Ao clicar em Assinar PRO, nossa API gera um QR Code Pix dinâmico. Assim que você realiza o pagamento no aplicativo do seu banco, o sistema reconhece a liquidação em segundos e libera a sua conta imediatamente.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Posso exportar os meus jogos gerados?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Sim! A versão PRO permite baixar os cartões gerados em formato TXT compatível com os principais importadores, ou formatar a impressão física diretamente na impressora.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <div className="landing-container animate-fade-in">
        {/* Header */}
        <header className="landing-header">
          <div className="logo-container">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 0 6px rgba(0, 255, 136, 0.8))' }}
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
                textShadow: '0 0 10px var(--accent-glow)',
              }}
            >
              Meu Trevo
            </div>
            <span className="badge-live" style={{ animationDuration: '1s' }}>
              RESULTADOS + ESTRATÉGIA
            </span>
          </div>
          <nav
            style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}
            className="landing-nav-links"
          >
            <Link
              href="/megasena"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
              }}
            >
              Mega-Sena
            </Link>
            <Link
              href="/lotofacil"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
              }}
            >
              Lotofácil
            </Link>
            <Link
              href="/quina"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
              }}
            >
              Quina
            </Link>
            <Link
              href="/lotomania"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: '600',
              }}
            >
              Lotomania
            </Link>
          </nav>
          <Link
            href="/app"
            className="theme-pill-btn active landing-header-app-link"
            style={{
              fontSize: '0.8rem',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              borderRadius: '8px',
              boxShadow: '0 0 10px var(--accent-glow)',
              textDecoration: 'none',
            }}
          >
            Entrar no App ⚡
          </Link>
        </header>

        {/* Hero Section */}
        <section className="landing-hero landing-hero-sales">
          <div className="landing-hero-copy">
            <h1 className="landing-title">Meu Trevo</h1>
            <p className="landing-hero-lead">
              Monte jogos de loteria com resultado oficial, análise histórica e
              desdobramentos em um painel simples de usar.
            </p>
            <p className="landing-subtitle">
              Consulte concursos da Caixa, teste suas dezenas antes de apostar e
              gere combinações com filtros de soma, atraso, par/ímpar e custo.
            </p>

            <div
              className="landing-proof-row"
              aria-label="Destaques do Meu Trevo"
            >
              <span>
                <strong>Caixa</strong> resultados oficiais
              </span>
              <span>
                <strong>Simulação</strong> histórico recente
              </span>
              <span>
                <strong>Pix</strong> Pro imediato
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
                }}
              >
                Começar grátis
              </Link>
              <a
                href="#testador-anchor"
                className="landing-btn-secondary"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                Testar meu jogo
              </a>
            </div>
          </div>

          <div
            className="landing-hero-preview"
            aria-label="Prévia do painel Meu Trevo"
          >
            <div className="hero-preview-header">
              <div>
                <span className="hero-preview-kicker">Último concurso</span>
                <strong>
                  Mega-Sena {result?.numero ? `#${result.numero}` : ''}
                </strong>
              </div>
              <span className="hero-preview-status">ao vivo</span>
            </div>
            <div className="hero-preview-balls">
              {cleanDezenas.map((num, i) => (
                <span key={`${num}-${i}`}>{num}</span>
              ))}
            </div>
            <div className="hero-preview-grid">
              <div>
                <span>Próximo prêmio</span>
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
                <span>Status</span>
                <strong>{result?.acumulado ? 'Acumulado' : 'Premiado'}</strong>
              </div>
              <div>
                <span>Filtro ativo</span>
                <strong>Par/ímpar</strong>
              </div>
              <div>
                <span>Exportação</span>
                <strong>TXT + impressão</strong>
              </div>
            </div>
            <div className="hero-preview-footer">
              <span className="pulse-dot"></span>
              Jogos montados com critérios visíveis antes da aposta
            </div>
          </div>
        </section>

        {/* Live Ticker Tape — seamless infinite loop */}
        {result &&
          (() => {
            const premio = result.valorEstimadoProximoConcurso
              ? `R$ ${result.valorEstimadoProximoConcurso.toLocaleString('pt-BR')}`
              : 'R$ 45 Mi';
            const tickerCards = [
              {
                key: 'mega-concurso',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#209869' }}
                    />
                    <strong>MEGA-SENA</strong>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Conc. {result.numero}
                    </span>
                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                      {cleanDezenas.map((num, i) => (
                        <span
                          key={`${num}-${i}`}
                          className="marquee-ball"
                          style={{ background: '#209869' }}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </>
                ),
                style: {
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                },
              },
              {
                key: 'lotofacil-paridade',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#93098f' }}
                    />
                    <strong>LOTOFÁCIL</strong>
                    <span style={{ color: '#00f0ff', fontWeight: 600 }}>
                      Par/Ímpar Equilibrado
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(147, 9, 143, 0.1)',
                  border: '1px solid rgba(147, 9, 143, 0.2)',
                },
              },
              {
                key: 'quina-acumulo',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#00f0ff' }}
                    />
                    <strong>QUINA</strong>
                    <span style={{ color: '#ffd600', fontWeight: 600 }}>
                      Acúmulo Crítico
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(38, 0, 133, 0.15)',
                  border: '1px solid rgba(38, 0, 133, 0.2)',
                },
              },
              {
                key: 'mega-premio',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#209869' }}
                    />
                    <strong>MEGA-SENA</strong>
                    <span style={{ color: '#00e676', fontWeight: 600 }}>
                      Prêmio: {premio}
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                },
              },
              {
                key: 'lotofacil-distribuicao',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#ff007f' }}
                    />
                    <strong>LOTOFÁCIL</strong>
                    <span style={{ color: '#ff4466', fontWeight: 600 }}>
                      Distribuição Uniforme
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(255, 0, 127, 0.1)',
                  border: '1px solid rgba(255, 0, 127, 0.2)',
                },
              },
              {
                key: 'quina-frequencia',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#ffd600' }}
                    />
                    <strong>QUINA</strong>
                    <span style={{ color: '#ffd600', fontWeight: 600 }}>
                      Frequência Alta
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(255, 214, 0, 0.1)',
                  border: '1px solid rgba(255, 214, 0, 0.2)',
                },
              },
              {
                key: 'lotofacil-atraso',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#00f0ff' }}
                    />
                    <strong>LOTOFÁCIL</strong>
                    <span style={{ color: '#00f0ff', fontWeight: 600 }}>
                      Atraso Crítico
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                },
              },
              {
                key: 'mega-soma',
                content: (
                  <>
                    <span
                      className="marquee-dot"
                      style={{ background: '#209869' }}
                    />
                    <strong>MEGA-SENA</strong>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Soma Ideal 110–180
                    </span>
                  </>
                ),
                style: {
                  background: 'rgba(32, 152, 105, 0.1)',
                  border: '1px solid rgba(32, 152, 105, 0.2)',
                },
              },
            ];
            return (
              <div
                className="marquee-ticker-container"
                style={{ margin: '1rem 0 2rem 0' }}
              >
                <div className="marquee-ticker-inner">
                  {[0, 1].flatMap((copyIndex) =>
                    tickerCards.map((item) => (
                      <div
                        key={`${item.key}-${copyIndex}`}
                        className="marquee-item"
                        style={item.style}
                      >
                        {item.content}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

        {/* Interactive Quick Board Simulator Client Component */}
        <div id="testador-anchor" />
        <QuickSimulator initialResult={result} initialLottery="megasena" />

        <div className="section-divider" id="features" />

        {/* Bento Features Grid */}
        <section style={{ padding: '1rem 0' }}>
          <h2 className="landing-section-title">
            <span>⚙️</span> COMO O MEU TREVO AJUDA
          </h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div
                className="feature-icon-wrapper"
                style={{
                  background: 'rgba(0, 230, 118, 0.1)',
                  borderColor: 'rgba(0, 230, 118, 0.2)',
                  color: '#00e676',
                }}
              >
                📊
              </div>
              <div className="feature-info">
                <h3>Resultado oficial sem garimpar site</h3>
                <p>
                  Veja concursos recentes, dezenas sorteadas e prêmio estimado
                  no mesmo lugar em que você monta os jogos.
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
                <h3>Jogos gerados com critério</h3>
                <p>
                  Use filtros de soma, atraso, repetição e par/ímpar para criar
                  combinações mais consistentes com seu objetivo.
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
                <h3>Desdobramentos para jogar em grupo</h3>
                <p>
                  Monte fechamentos e bolões com mais cobertura sem perder o
                  controle da quantidade de volantes.
                </p>
              </div>
            </div>

            <div className="landing-feature-card">
              <div
                className="feature-icon-wrapper"
                style={{
                  background: 'rgba(255, 214, 0, 0.1)',
                  borderColor: 'rgba(255, 214, 0, 0.2)',
                  color: '#ffd600',
                }}
              >
                💸
              </div>
              <div className="feature-info">
                <h3>Controle de custo e prêmio</h3>
                <p>
                  Registre gastos, acompanhe prêmios e exporte cartões para TXT
                  ou impressão quando quiser jogar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider" id="pricing" />

        {/* Pricing Section */}
        <section style={{ padding: '1rem 0' }}>
          <h2 className="landing-section-title">
            <span>💎</span> ESCOLHA COMO COMEÇAR
          </h2>

          <div className="landing-pricing-cards">
            {/* Free Plan */}
            <div
              className="landing-price-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="price-card-header">
                  <h3>Grátis</h3>
                  <p>Para consultar, testar e gerar o primeiro jogo.</p>
                </div>
                <div className="price-amount">
                  <span className="price-val">Grátis</span>
                </div>
                <ul className="price-features-list">
                  <li className="price-feature-item checked">
                    Resultados oficiais da Caixa
                  </li>
                  <li className="price-feature-item checked">
                    Testador expresso de dezenas
                  </li>
                  <li className="price-feature-item checked">
                    Gerador Smart básico
                  </li>
                  <li className="price-feature-item unchecked">
                    Meus Jogos com organização básica
                  </li>
                  <li className="price-feature-item unchecked">
                    Desdobramentos e simulações avançadas
                  </li>
                  <li className="price-feature-item unchecked">
                    Controle financeiro, exportação e temas Pro
                  </li>
                </ul>
              </div>
              <Link
                href="/app"
                className="landing-btn-secondary"
                style={{
                  textDecoration: 'none',
                  width: '100%',
                  marginTop: '1rem',
                  display: 'inline-flex',
                  justifyContent: 'center',
                }}
              >
                Começar grátis
              </Link>
            </div>

            {/* Pro Plan */}
            <div
              className="landing-price-card pro"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="price-card-header">
                  <h3>Meu Trevo Pro</h3>
                  <p>
                    Para montar jogos, bolões e desdobramentos com mais
                    controle.
                  </p>
                </div>
                <div className="price-amount">
                  <span className="price-period">R$</span>
                  <span className="price-val">
                    {priceMonthly.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="price-period">/mês</span>
                </div>
                <ul className="price-features-list">
                  <li className="price-feature-item checked">
                    <strong>Desdobramentos otimizados para bolões</strong>
                  </li>
                  <li className="price-feature-item checked">
                    Gerador avançado com filtros de soma, repetição e atraso
                  </li>
                  <li className="price-feature-item checked">
                    Meus Jogos com filtros, agrupamentos e seleção em massa
                  </li>
                  <li className="price-feature-item checked">
                    Simulação histórica e comparação de estratégias
                  </li>
                  <li className="price-feature-item checked">
                    Controle financeiro de gastos, prêmios e desempenho
                  </li>
                  <li className="price-feature-item checked">
                    Alertas por e-mail, temas exclusivos e recursos extras
                  </li>
                  <li className="price-feature-item checked">
                    Exportação, impressão e apoio para montagem de bolões
                  </li>
                </ul>
              </div>
              <Link
                href="/app"
                className="landing-btn-primary"
                style={{
                  textDecoration: 'none',
                  width: '100%',
                  marginTop: '1rem',
                  display: 'inline-flex',
                  justifyContent: 'center',
                }}
              >
                Assinar PRO
              </Link>
            </div>
          </div>
        </section>

        <div className="section-divider" id="faq" />

        {/* FAQ Section */}
        <section style={{ padding: '1rem 0 3rem 0' }}>
          <h2 className="landing-section-title">
            <span>❓</span> PERGUNTAS FREQUENTES
          </h2>
          <div className="landing-faq-accordion">
            <div className="faq-item">
              <strong
                className="faq-question"
                style={{ color: 'white', padding: '1rem', display: 'block' }}
              >
                O Meu Trevo garante que eu vou ganhar na loteria?
              </strong>
              <div
                className="faq-answer"
                style={{
                  display: 'block',
                  padding: '0 1rem 1rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Não. Loterias são jogos baseados em aleatoriedade pura e sorte.
                Nenhuma ferramenta pode prever os números que vão sair. O Meu
                Trevo utiliza estatística histórica real e análise combinatória
                para otimizar suas apostas.
              </div>
            </div>
            <div className="faq-item">
              <strong
                className="faq-question"
                style={{ color: 'white', padding: '1rem', display: 'block' }}
              >
                Como funcionam os desdobramentos (fechamentos)?
              </strong>
              <div
                className="faq-answer"
                style={{
                  display: 'block',
                  padding: '0 1rem 1rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                O desdobramento combinatório seleciona jogos específicos dentro
                de um grupo de números escolhidos para garantir premiações se
                uma certa quantidade de dezenas sorteadas estiver no seu grupo.
              </div>
            </div>
          </div>
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
                <li>
                  <Link
                    href="/duplasena"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
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
                      transition: 'color 0.2s',
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
                      transition: 'color 0.2s',
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
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    Super Sete
                  </Link>
                </li>
                <li>
                  <Link
                    href="/maismilionaria"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    className="hover-glow-text"
                  >
                    +Milionária
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
