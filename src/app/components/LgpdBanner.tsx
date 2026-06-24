'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('meutrevo-lgpd-consent');
    if (!consent) {
      // Delay slightly for entry animation
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('meutrevo-lgpd-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('meutrevo-lgpd-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        background: 'rgba(8, 8, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 240, 255, 0.2)',
        borderRadius: '16px',
        boxShadow:
          '0 8px 32px 0 rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 240, 255, 0.1)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        maxWidth: '1200px',
        margin: '0 auto',
        animation: 'slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ flex: '1 1 500px' }}>
        <h4
          style={{
            color: '#00f0ff',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            margin: '0 0 0.35rem 0',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          🛡️ PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
        </h4>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.78rem',
            lineHeight: '1.5',
            margin: 0,
          }}
        >
          O Meu Trevo utiliza cookies essenciais para manter sua sessão ativa na
          plataforma e melhorar sua experiência de navegação. Ao prosseguir,
          você consente com a nossa coleta de dados mínima em conformidade com a
          Lei Geral de Proteção de Dados (LGPD). Consulte nossos{' '}
          <Link
            href="/terms"
            style={{ color: '#00f0ff', textDecoration: 'underline' }}
          >
            Termos de Uso
          </Link>{' '}
          e nossa{' '}
          <Link
            href="/privacy"
            style={{ color: '#00f0ff', textDecoration: 'underline' }}
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap' }}>
        <button
          onClick={handleDecline}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.75rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border =
              '1px solid rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          Recusar
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: 'linear-gradient(90deg, #00f0ff, #00e5ff)',
            border: 'none',
            color: '#000',
            fontSize: '0.75rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Aceitar Termos
        </button>
      </div>

      <style jsx global>{`
        @keyframes slide-up-fade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
