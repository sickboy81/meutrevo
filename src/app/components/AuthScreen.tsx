'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/fetch';
import type { User } from '../types';

interface AuthScreenProps {
  onAuth: (user: User) => void;
  playSound: (type: 'click' | 'success' | 'delete') => void;
  syncProfileDrafts: (user: User) => void;
  fetchSavedGames: () => void;
}

export default function AuthScreen({
  onAuth,
  playSound,
  syncProfileDrafts,
  fetchSavedGames,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover'>(
    'login'
  );
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authCpfCnpj, setAuthCpfCnpj] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    if (authMode === 'recover') {
      try {
        const res = await fetchWithCsrf('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          playSound('success');
          setAuthSuccess(
            data.message ||
              'Se o e-mail informado estiver cadastrado, você receberá um link de recuperação.'
          );
          setAuthEmail('');
        } else {
          setAuthError(data.error || 'Ocorreu um erro.');
        }
      } catch {
        setAuthError('Erro de conexão com o servidor.');
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (authMode === 'register' && !acceptedTerms) {
      setAuthError(
        'Você deve aceitar os Termos de Uso e a Política de Privacidade.'
      );
      setAuthLoading(false);
      return;
    }

    const endpoint =
      authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : {
            email: authEmail,
            name: authName,
            password: authPassword,
            cpf_cnpj: authCpfCnpj || undefined,
          };

    try {
      const res = await fetchWithCsrf(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        playSound('success');
        onAuth(data.user);
        syncProfileDrafts(data.user);
        setAuthPassword('');
        setAuthEmail('');
        setAuthName('');
        setAuthCpfCnpj('');
        fetchSavedGames();
      } else {
        setAuthError(data.error || 'Ocorreu um erro.');
      }
    } catch {
      setAuthError('Erro de conexão com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div
      className="app-content"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 100px)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          position: 'relative',
          border: '2px solid var(--accent-color)',
          boxShadow: '0 0 15px var(--accent-glow)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
            }}
          >
            <span style={{ fontSize: '2rem' }}>🍀</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '1px',
              }}
            >
              Meu Trevo
            </span>
          </Link>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '0.5rem',
            }}
          >
            {authMode === 'login'
              ? 'Bem-vindo de volta!'
              : authMode === 'register'
                ? 'Crie sua conta gratuita'
                : 'Recupere seu acesso'}
          </p>
        </div>

        <form
          onSubmit={handleAuthSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {authMode === 'register' && (
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem',
                  display: 'block',
                }}
              >
                Nome Completo
              </label>
              <input
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
                placeholder="Seu nome"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginBottom: '0.3rem',
                display: 'block',
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem',
                  display: 'block',
                }}
              >
                CPF/CNPJ
              </label>
              <input
                type="text"
                value={authCpfCnpj}
                onChange={(e) => setAuthCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {authMode !== 'recover' && (
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem',
                  display: 'block',
                }}
              >
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  placeholder={
                    authMode === 'register'
                      ? 'Mínimo 6 caracteres'
                      : 'Sua senha'
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'white',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '0.8rem',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

          {authMode === 'register' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginTop: '-0.5rem',
              }}
            >
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: '3px', accentColor: 'var(--accent-color)' }}
              />
              <label
                htmlFor="terms"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  cursor: 'pointer',
                }}
              >
                Aceito os{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
                >
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
                >
                  Política de Privacidade
                </Link>
                .
              </label>
            </div>
          )}

          {authError && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 23, 68, 0.15)',
                border: '1px solid rgba(255, 23, 68, 0.3)',
                color: '#ff1744',
                fontSize: '0.8rem',
                textAlign: 'center',
              }}
            >
              {authError}
            </div>
          )}

          {authSuccess && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                color: '#00e676',
                fontSize: '0.8rem',
                textAlign: 'center',
              }}
            >
              {authSuccess}
            </div>
          )}

          <button
            type="submit"
            className="btn-action"
            disabled={authLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {authLoading
              ? '⏳ Processando...'
              : authMode === 'login'
                ? '🔓 Entrar'
                : authMode === 'register'
                  ? '📝 Criar Conta Gratuita'
                  : '📧 Enviar Link de Recuperação'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {authMode === 'login' && (
            <>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.75rem',
                }}
              >
                Não tem conta?{' '}
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-color)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Cadastre-se grátis
                </button>
              </p>
              <button
                onClick={() => {
                  setAuthMode('recover');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                Esqueceu a senha?
              </button>
            </>
          )}

          {authMode === 'register' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Já tem uma conta?{' '}
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Entrar
              </button>
            </p>
          )}

          {authMode === 'recover' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Lembrou sua senha?{' '}
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-color)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Voltar ao Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
