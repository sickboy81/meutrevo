'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppEntryLink from '../components/AppEntryLink';
import { fetchWithCsrf } from '@/lib/fetch';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithCsrf('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(
          'Sua senha foi redefinida com sucesso! Você já pode entrar no aplicativo com a nova senha.'
        );
        setPassword('');
        setConfirmPassword('');
        // Redirect to /app after 3 seconds
        setTimeout(() => {
          router.push('/app');
        }, 3000);
      } else {
        setError(data.error || 'Ocorreu um erro ao redefinir a senha.');
      }
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 0',
          color: 'var(--text-muted)',
        }}
      >
        <h2
          style={{
            color: '#ff1744',
            fontSize: '1.4rem',
            fontFamily: 'var(--font-body)',
            marginBottom: '1rem',
          }}
        >
          ⚠️ Link de Redefinição Inválido
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            maxWidth: '400px',
            margin: '0 auto 1.5rem auto',
            lineHeight: '1.6',
          }}
        >
          Este link está incompleto ou expirou. Solicite um novo link de
          recuperação de senha através da tela de login.
        </p>
        <AppEntryLink
          style={{
            color: 'var(--accent-color)',
            textDecoration: 'underline',
            fontSize: '0.85rem',
          }}
        >
          Voltar para o App
        </AppEntryLink>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--glass-border)',
        padding: '2rem',
        borderRadius: '16px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)',
      }}
    >
      <h1
        className="landing-title"
        style={{
          fontSize: '1.6rem',
          textAlign: 'center',
          marginBottom: '1rem',
          fontFamily: 'var(--font-body)',
          textShadow: '0 0 10px var(--accent-glow)',
        }}
      >
        Nova Senha
      </h1>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginBottom: '1.5rem',
          lineHeight: '1.5',
        }}
      >
        Digite sua nova senha abaixo para redefinir o acesso à sua conta.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
        >
          <label
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Nova Senha
          </label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.8rem',
              padding: '0.55rem',
              width: '100%',
            }}
          />
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
        >
          <label
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            placeholder="Confirme a nova senha"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.8rem',
              padding: '0.55rem',
              width: '100%',
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: '#ff1744',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: 'rgba(255,23,68,0.1)',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,23,68,0.2)',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              color: '#00f0ff',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              background: 'rgba(0,240,255,0.1)',
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            ✔ {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--accent-color)',
            border: 'none',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            padding: '0.6rem',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 10px var(--accent-glow)',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
            marginTop: '0.5rem',
          }}
        >
          {loading ? 'Processando...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      className="app-container theme-meganeon"
      style={
        {
          '--active-color': '#00f0ff',
          '--active-glow': 'rgba(0, 240, 255, 0.4)',
          minHeight: '100vh',
        } as React.CSSProperties
      }
    >
      <div
        className="landing-container animate-fade-in"
        style={{ paddingInline: '1.5rem' }}
      >
        {/* Navigation / Header */}
        <header
          className="landing-header"
          style={{ paddingInline: 0, marginBottom: '3rem' }}
        >
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
              REDEFINIR
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <AppEntryLink
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              Voltar ao App
            </AppEntryLink>
          </div>
        </header>

        <Suspense
          fallback={
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        <footer
          style={{
            marginTop: '5rem',
            padding: '2rem 0',
            borderTop: '1px solid var(--glass-border)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Meu Trevo. Todos os direitos
            reservados.
          </span>
        </footer>
      </div>
    </main>
  );
}
