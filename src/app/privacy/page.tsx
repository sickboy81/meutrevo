import Link from 'next/link';
import AppEntryLink from '../components/AppEntryLink';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas de Privacidade - Meu Trevo',
  description:
    'Entenda como o Meu Trevo coleta, armazena e protege os dados cadastrais dos usuários da plataforma de forma segura e transparente.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#ff007f',
          '--active-glow': 'rgba(255, 0, 127, 0.4)',
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
            <span
              className="badge-live"
              style={{ animationDuration: '1s', background: '#ff007f' }}
            >
              PRIVACIDADE
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
            Políticas de Privacidade
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
                1. Coleta de Dados Pessoais
              </h2>
              <p>
                Nós coletamos apenas as informações cadastrais mínimas e
                estritamente necessárias para o funcionamento seguro da conta e
                autenticação (como nome completo, endereço de e-mail e senha
                criptografada).
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
                2. Processamento de Pagamento
              </h2>
              <p>
                Os pagamentos via Pix são processados de forma automatizada pelo
                nosso intermediador financeiro. O Meu Trevo{' '}
                <strong>
                  não armazena ou tem acesso direto aos dados da sua conta
                  bancária
                </strong>{' '}
                ou informações financeiras sensíveis.
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
                3. Armazenamento e Segurança dos Dados
              </h2>
              <p>
                Suas informações cadastrais e dados de jogos gerados/salvos são
                criptografados e armazenados em servidores seguros de banco de
                dados na nuvem.
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
                4. Cookies e Rastreamento
              </h2>
              <p>
                Utilizamos cookies apenas para manter sua sessão activa na
                plataforma (login persistente) e métricas básicas anônimas de
                tráfego. Você pode desabilitar os cookies nas configurações do
                seu navegador a qualquer momento.
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
                5. Contato e Esclarecimento de Dúvidas
              </h2>
              <p>
                Se você tiver alguma dúvida em relação a estas políticas ou
                desejar a exclusão definitiva dos seus dados da plataforma Meu
                Trevo de acordo com a LGPD, você pode fazê-lo a qualquer momento
                de forma direta e instantânea na seção &quot;Perfil&quot; dentro
                do painel do aplicativo. Para outras dúvidas, entre em contato
                com nosso suporte.
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
