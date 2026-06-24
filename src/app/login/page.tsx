'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';

type AuthMode = 'login' | 'register' | 'recover';

const BRAZIL_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

function PasswordEyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.25 12s3.5-6.5 9.75-6.5 9.75 6.5 9.75 6.5-3.5 6.5-9.75 6.5S2.25 12 2.25 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {visible && (
        <path
          d="M4.5 19.5 19.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nextUrl, setNextUrl] = useState('/app');

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const nextPath =
        next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
      setNextUrl(nextPath);

      const requestedMode = params.get('mode');
      if (requestedMode === 'register') {
        setMode('register');
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    resetFeedback();

    if (mode === 'register' && !acceptedTerms) {
      setError(
        'Você deve aceitar os Termos de Uso e a Política de Privacidade.'
      );
      setLoading(false);
      return;
    }

    const endpoint =
      mode === 'recover'
        ? '/api/auth/recover'
        : mode === 'login'
          ? '/api/auth/login'
          : '/api/auth/register';
    const payload =
      mode === 'recover'
        ? { email }
        : mode === 'login'
          ? { email, password }
          : {
              email,
              name,
              password,
              cpf_cnpj: cpfCnpj,
              city: city || undefined,
              state: state || undefined,
            };

    try {
      const response = await fetchWithCsrf(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Não foi possível concluir a solicitação.');
        return;
      }

      if (mode === 'recover') {
        setSuccess(
          data.message ||
            'Se o e-mail informado estiver cadastrado, você receberá um link de recuperação.'
        );
        setEmail('');
        return;
      }

      router.replace(nextUrl);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="landing-container animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <section
        className="glass-panel auth-card"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '1.5rem',
          border: '1px solid var(--accent-color)',
          boxShadow: '0 0 18px var(--accent-glow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🍀</span>
            <span className="logo-text" style={{ fontSize: '1.35rem' }}>
              Meu Trevo
            </span>
          </Link>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              marginTop: '0.5rem',
            }}
          >
            {mode === 'login'
              ? 'Entre para acessar o app.'
              : mode === 'register'
                ? 'Crie sua conta para usar o app.'
                : 'Recupere seu acesso.'}
          </p>
        </div>

        <div className="options-selector" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className={`option-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => changeMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`option-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => changeMode('register')}
          >
            Cadastrar
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
        >
          {mode === 'register' && (
            <label className="auth-label">
              Nome completo
              <input
                className="auth-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Seu nome"
              />
            </label>
          )}

          <label className="auth-label">
            E-mail
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="seu@email.com"
            />
          </label>

          {mode === 'register' && (
            <>
              <label className="auth-label">
                CPF/CNPJ
                <input
                  className="auth-input"
                  type="text"
                  value={cpfCnpj}
                  onChange={(event) => setCpfCnpj(event.target.value)}
                  required
                  placeholder="000.000.000-00"
                />
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 88px',
                  gap: '0.55rem',
                }}
              >
                <label className="auth-label">
                  Cidade
                  <input
                    className="auth-input"
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Sua cidade"
                  />
                </label>
                <label className="auth-label">
                  UF
                  <select
                    className="auth-input"
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                  >
                    <option value="">UF</option>
                    {BRAZIL_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {mode !== 'recover' && (
            <label className="auth-label">
              Senha
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder={
                    mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'
                  }
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{
                    position: 'absolute',
                    right: '0.45rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PasswordEyeIcon visible={showPassword} />
                </button>
              </div>
            </label>
          )}

          {mode === 'register' && (
            <label
              style={{
                display: 'flex',
                gap: '0.45rem',
                alignItems: 'flex-start',
                fontSize: '0.72rem',
                color: 'var(--text-main)',
                lineHeight: 1.35,
              }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
                style={{
                  marginTop: '0.1rem',
                  accentColor: 'var(--accent-color)',
                }}
              />
              <span>
                Li e aceito os{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  style={{ color: 'var(--accent-color)' }}
                >
                  Termos
                </Link>{' '}
                e a{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  style={{ color: 'var(--accent-color)' }}
                >
                  Privacidade
                </Link>
                .
              </span>
            </label>
          )}

          {error && (
            <div
              style={{
                color: '#ff8a80',
                background: 'rgba(255,68,102,0.1)',
                border: '1px solid rgba(255,68,102,0.25)',
                padding: '0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                color: '#00e676',
                background: 'rgba(0,230,118,0.1)',
                border: '1px solid rgba(0,230,118,0.25)',
                padding: '0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn-action"
            disabled={loading || (mode === 'register' && !acceptedTerms)}
            style={{
              marginTop: '0.25rem',
              opacity:
                loading || (mode === 'register' && !acceptedTerms) ? 0.65 : 1,
            }}
          >
            {loading
              ? 'Processando...'
              : mode === 'login'
                ? 'Entrar no app'
                : mode === 'register'
                  ? 'Criar conta grátis'
                  : 'Enviar link de recuperação'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => changeMode('recover')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
              }}
            >
              Esqueci minha senha
            </button>
          )}
          {mode === 'recover' && (
            <button
              type="button"
              onClick={() => changeMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
              }}
            >
              Voltar para login
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
