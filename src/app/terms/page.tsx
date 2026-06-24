import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso - Meu Trevo',
  description:
    'Leia os Termos de Uso do Meu Trevo para entender as diretrizes de funcionamento da nossa plataforma estatística de loterias.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
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
        className="landing-container animate-fade-in"
        style={{ paddingInline: '1.5rem' }}
      >
        {/* Navigation / Header */}
        <header className="landing-header" style={{ paddingInline: 0 }}>
          <div className="logo-container">
            <Link
              href="/"
              className="logo-text"
              style={{
                textDecoration: 'none',
                fontSize: '1.4rem',
                textShadow: '0 0 10px var(--accent-glow)',
              }}
            >
              Meu Trevo
            </Link>
            <span className="badge-live" style={{ animationDuration: '1s' }}>
              TERMOS
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

        {/* Content Section */}
        <section style={{ padding: '3rem 0', color: 'var(--text-main)' }}>
          <h1
            className="landing-title"
            style={{
              fontSize: '2.2rem',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-body)',
              textShadow: '0 0 10px var(--accent-glow)',
            }}
          >
            Termos de Uso
          </h1>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginBottom: '2rem',
            }}
          >
            Última atualização: 8 de junho de 2026
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--text-muted)',
            }}
          >
            <div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e usar a plataforma Meu Trevo, você concorda
                expressamente em cumprir e estar vinculado a estes Termos de
                Uso. Se você não concordar com qualquer termo aqui descrito, não
                deverá utilizar nossa plataforma ou serviços.
              </p>
            </div>

            <div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                2. Natureza Informativa e Estatística
              </h2>
              <p>
                O Meu Trevo é um assistente estatístico e matemático. Nós{' '}
                <strong>não realizamos apostas</strong>, não temos qualquer
                vínculo com a Caixa Econômica Federal e{' '}
                <strong>não garantimos enriquecimento ou premiações</strong> nas
                loterias oficiais.
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                Os jogos e fechamentos matemáticos gerados na plataforma servem
                estritamente para otimização probabilística, restando ao usuário
                a decisão de registrá-los em canais oficiais autorizados.
              </p>
            </div>

            <div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                3. Assinatura PRO e Ativação
              </h2>
              <p>
                O acesso às ferramentas premium (como desdobramentos de bolões e
                exportação de jogos) é liberado mediante assinatura mensal
                recorrente ou plano anual pago via Pix automático. A liberação
                ocorre de forma instantânea assim que a confirmação de pagamento
                do Pix é enviada pelo nosso intermediador parceiro.
              </p>
            </div>

            <div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                4. Limitação de Responsabilidade
              </h2>
              <p>
                O usuário assume total responsabilidade financeira e pessoal por
                suas escolhas e gastos efetuados em lotéricas reais. O Meu Trevo
                não se responsabiliza por eventuais perdas financeiras
                resultantes de apostas registradas na expectativa de ganhos.
              </p>
            </div>

            <div>
              <h2
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                5. Modificações dos Termos
              </h2>
              <p>
                Reservamo-nos o direito de alterar estes Termos de Uso a
                qualquer momento. Modificações serão publicadas nesta página com
                a data da última atualização atualizada.
              </p>
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
              className="logo-text"
              style={{
                fontSize: '1.4rem',
                textShadow: '0 0 12px var(--accent-glow)',
              }}
            >
              Meu Trevo
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
