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
    <>
      <div
        className="lgpd-banner"
        role="region"
        aria-label="Preferências de privacidade"
      >
        <div className="lgpd-banner-copy">
          <h4>🛡️ PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h4>
          <p>
            Usamos apenas cookies essenciais para manter sua sessão e lembrar
            esta escolha. Consulte os <Link href="/terms">Termos de Uso</Link> e
            a <Link href="/privacy">Política de Privacidade</Link>.
          </p>
        </div>

        <div className="lgpd-banner-actions">
          <button onClick={handleDecline} className="lgpd-banner-decline">
            Recusar
          </button>
          <button onClick={handleAccept} className="lgpd-banner-accept">
            Aceitar
          </button>
        </div>
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

        .lgpd-banner {
          position: fixed;
          right: 1.25rem;
          bottom: 1.25rem;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          width: min(calc(100% - 2.5rem), 560px);
          padding: 0.85rem 1rem;
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 16px;
          background: rgba(8, 8, 15, 0.94);
          box-shadow:
            0 12px 38px rgba(0, 0, 0, 0.72),
            0 0 18px rgba(0, 240, 255, 0.1);
          backdrop-filter: blur(16px);
          animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .lgpd-banner-copy {
          flex: 1 1 520px;
        }
        .lgpd-banner-copy h4 {
          margin: 0 0 0.3rem;
          color: #00f0ff;
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .lgpd-banner-copy p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.74rem;
          line-height: 1.45;
        }
        .lgpd-banner-copy a {
          color: #00f0ff;
          text-decoration: underline;
        }
        .lgpd-banner-actions {
          display: flex;
          flex: 0 0 auto;
          gap: 0.6rem;
        }
        .lgpd-banner-actions button {
          min-height: 38px;
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.72rem;
          font-weight: 800;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }
        .lgpd-banner-actions button:hover {
          transform: translateY(-1px);
        }
        .lgpd-banner-decline {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
        }
        .lgpd-banner-decline:hover {
          border-color: rgba(255, 255, 255, 0.36);
          color: #fff;
        }
        .lgpd-banner-accept {
          border: 0;
          background: linear-gradient(90deg, #00f0ff, #00e676);
          color: #02060a;
          box-shadow: 0 0 12px rgba(0, 240, 255, 0.28);
        }
        .lgpd-banner-accept:hover {
          box-shadow: 0 0 18px rgba(0, 240, 255, 0.46);
        }

        @media (max-width: 640px) {
          .lgpd-banner {
            right: 0.75rem;
            bottom: max(0.75rem, env(safe-area-inset-bottom));
            align-items: stretch;
            gap: 0.7rem;
            width: calc(100% - 1.5rem);
            max-height: min(180px, calc(100dvh - 1.5rem));
            overflow: auto;
            padding: 0.8rem;
            flex-direction: column;
          }
          .lgpd-banner-copy h4 {
            font-size: 0.65rem;
          }
          .lgpd-banner-copy {
            flex: 0 1 auto;
          }
          .lgpd-banner-copy p {
            font-size: 0.66rem;
            line-height: 1.35;
          }
          .lgpd-banner-actions {
            display: grid;
            grid-template-columns: 0.9fr 1.25fr;
            width: 100%;
          }
          .lgpd-banner-actions button {
            width: 100%;
            min-height: 40px;
            padding-inline: 0.5rem;
            font-size: 0.68rem;
          }
        }
      `}</style>
    </>
  );
}
