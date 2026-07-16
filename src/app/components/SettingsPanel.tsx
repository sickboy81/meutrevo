'use client';

import React, { useState } from 'react';
import type { User, ThemeType } from '../types';
import ProfilePanel from './ProfilePanel';

interface SettingsPanelProps {
  playSound: (type: 'click' | 'success' | 'delete') => void;
  showInRanking: boolean;
  onSetShowInRanking: (v: boolean) => void;
  emailAlerts: boolean;
  onSetEmailAlerts: (v: boolean) => void;
  enableSounds: boolean;
  onSetEnableSounds: (v: boolean) => void;
  theme: ThemeType;
  onSetTheme: (t: ThemeType) => void;
  historyLimit: number;
  onSetHistoryLimit: (n: number) => void;
  onShowTutorial: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onSaveProfile: (data: {
    name: string;
    password: string;
    avatar: string;
    favorite_lottery: string;
    cpf_cnpj: string;
    city: string;
    state: string;
  }) => Promise<void>;
  profileFeedback: string;
  profileLoading: boolean;
  onFactoryReset: () => void;
  user: User | null;
  isPro: boolean;
  onShowUpgrade: () => void;
  setShowSettings: (v: boolean) => void;
  settingsRef: React.RefObject<HTMLDivElement | null>;
}

const DIVIDER = {
  borderTop: '1px solid rgba(255,255,255,0.05)',
  paddingTop: '0.5rem',
} as const;
const CHECKBOX_STYLE = {
  width: '16px',
  height: '16px',
  accentColor: 'var(--accent-color)',
};

const THEME_STYLES: Record<ThemeType, React.CSSProperties> = {
  cyberpunk: {
    '--accent-color': '#ff007f',
    '--accent-glow': 'rgba(255,0,127,0.3)',
  } as React.CSSProperties,
  matrix: {
    '--accent-color': '#00ff41',
    '--accent-glow': 'rgba(0,255,65,0.3)',
  } as React.CSSProperties,
  dracula: {
    '--accent-color': '#ff79c6',
    '--accent-glow': 'rgba(255,121,198,0.3)',
  } as React.CSSProperties,
  ice: {
    '--accent-color': '#00e5ff',
    '--accent-glow': 'rgba(0,229,255,0.3)',
  } as React.CSSProperties,
  meganeon: {
    '--accent-color': '#00e676',
    '--accent-glow': 'rgba(0,230,118,0.3)',
  } as React.CSSProperties,
};

export default function SettingsPanel({
  playSound,
  showInRanking,
  onSetShowInRanking,
  emailAlerts,
  onSetEmailAlerts,
  enableSounds,
  onSetEnableSounds,
  theme,
  onSetTheme,
  historyLimit,
  onSetHistoryLimit,
  onShowTutorial,
  onLogout,
  onDeleteAccount,
  onSaveProfile,
  profileFeedback,
  profileLoading,
  onFactoryReset,
  user,
  isPro,
  onShowUpgrade,
  setShowSettings,
  settingsRef,
}: SettingsPanelProps) {
  const [settingsSubTab, setSettingsSubTab] = useState<'config' | 'account'>(
    'config'
  );

  return (
    <div
      ref={settingsRef}
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '100%',
        right: '1rem',
        left: 'auto',
        width: 'calc(100vw - 2rem)',
        maxWidth: '380px',
        zIndex: 200,
        marginTop: '0.5rem',
        animation: 'fade-in 0.2s ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        padding: '1.25rem',
        maxHeight: 'min(78vh, 680px)',
        overflowY: 'auto',
      }}
    >
      {/* Menu Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.3)',
          padding: '0.2rem',
          borderRadius: '8px',
          border: '1px solid var(--glass-border)',
          marginBottom: '0.25rem',
        }}
      >
        {(
          [
            ['config', '⚙️ Ajustes'],
            ['account', '👤 Conta'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => {
              playSound('click');
              setSettingsSubTab(tab);
            }}
            style={{
              flex: 1,
              background:
                settingsSubTab === tab ? 'var(--accent-color)' : 'transparent',
              border: 'none',
              color: settingsSubTab === tab ? '#000' : 'var(--text-muted)',
              fontSize: '0.75rem',
              padding: '0.4rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {settingsSubTab === 'config' ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        >
          {/* Seletor de Temas */}
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '0.35rem',
                fontWeight: 600,
              }}
            >
              🎨 TEMA NEON VISUAL
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {(
                [
                  'meganeon',
                  'cyberpunk',
                  'matrix',
                  'dracula',
                  'ice',
                ] as ThemeType[]
              ).map((t) => (
                <button
                  key={t}
                  className={`theme-pill-btn ${theme === t ? 'active' : ''}`}
                  onClick={() => {
                    if (t === 'meganeon' || isPro) {
                      onSetTheme(t);
                    } else {
                      onShowUpgrade();
                    }
                  }}
                  style={THEME_STYLES[t]}
                >
                  {t === 'meganeon' ? 'MEGA-GREEN' : t.toUpperCase()}
                  {t !== 'meganeon' && !isPro && ' 👑'}
                </button>
              ))}
            </div>
          </div>

          {/* Amostragem de Concursos */}
          <div style={DIVIDER}>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '0.35rem',
                fontWeight: 600,
              }}
            >
              📊 AMOSTRAGEM DE CONCURSOS
            </span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {([10, 30, 50, 100] as number[]).map((limit) => (
                <button
                  key={limit}
                  className={`theme-pill-btn ${historyLimit === limit ? 'active' : ''}`}
                  onClick={() => {
                    if (limit === 30 || isPro) {
                      playSound('click');
                      onSetHistoryLimit(limit);
                    } else {
                      onShowUpgrade();
                    }
                  }}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {limit} Jogos{limit !== 30 && !isPro && ' 👑'}
                </button>
              ))}
            </div>
          </div>

          {/* Efeitos Sonoros & Alertas */}
          <div
            style={{
              ...DIVIDER,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={enableSounds}
                onChange={(e) => {
                  onSetEnableSounds(e.target.checked);
                  if (e.target.checked)
                    setTimeout(() => playSound('click'), 50);
                }}
                style={CHECKBOX_STYLE}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                🔊 Efeitos Sonoros Sintéticos (Web Audio)
              </span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={() => onSetEmailAlerts(!emailAlerts)}
                style={CHECKBOX_STYLE}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                📧 Alertas de Resultados por E-mail
              </span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showInRanking}
                onChange={(e) => onSetShowInRanking(e.target.checked)}
                style={CHECKBOX_STYLE}
              />
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                🏆 Aparecer no Ranking Geral
              </span>
            </label>
          </div>

          {/* Tour Guiado */}
          <div style={{ ...DIVIDER, marginTop: '0.25rem' }}>
            <button
              onClick={() => {
                playSound('click');
                setShowSettings(false);
                onShowTutorial();
              }}
              style={{
                width: '100%',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid #00f0ff',
                color: '#00f0ff',
                fontSize: '0.75rem',
                padding: '0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0, 240, 255, 0.15)',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              🚀 INICIAR TOUR ONBOARDING
            </button>
          </div>

          {/* Reset de Fábrica */}
          <div style={{ ...DIVIDER, marginTop: '0.25rem' }}>
            <button
              onClick={onFactoryReset}
              style={{
                width: '100%',
                background: 'rgba(255, 23, 68, 0.1)',
                border: '1px solid #ff1744',
                color: '#ff1744',
                fontSize: '0.75rem',
                padding: '0.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(255, 23, 68, 0.15)',
                transition: 'background 0.2s',
              }}
            >
              ⚠️ RESETAR APLICATIVO
            </button>
          </div>
        </div>
      ) : (
        /* --- CONTA / ACCOUNT TAB --- */
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
        >
          {user ? (
            <>
              {/* Plan summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(0, 240, 255, 0.04)',
                    border: '1px solid rgba(0, 240, 255, 0.1)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    E-mail
                  </div>
                  <strong
                    style={{
                      fontSize: '0.7rem',
                      color: 'white',
                      wordBreak: 'break-all',
                    }}
                  >
                    {user.email}
                  </strong>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 0, 127, 0.04)',
                    border: '1px solid rgba(255, 0, 127, 0.1)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Plano Ativo
                  </div>
                  <strong
                    style={{
                      fontSize: '0.75rem',
                      color:
                        user.role === 'pro' ? '#00e676' : 'var(--text-muted)',
                      display: 'block',
                      marginTop: '0.2rem',
                    }}
                  >
                    {user.role?.toUpperCase() || 'FREE'}
                  </strong>
                  {user.role === 'pro' && user.premium_until && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        color: 'var(--text-muted)',
                        display: 'block',
                        marginTop: '0.15rem',
                      }}
                    >
                      Expira:{' '}
                      {new Date(user.premium_until).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {user.role !== 'pro' && user.role !== 'admin' && (
                <div
                  onClick={() => {
                    onShowUpgrade();
                    setShowSettings(false);
                  }}
                  className="hover-scale"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255, 0, 127, 0.15) 0%, rgba(255, 214, 0, 0.15) 100%)',
                    border: '1px solid #ff007f',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 10px rgba(255, 0, 127, 0.25)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'block',
                    }}
                  >
                    👑 UPGRADE PARA PREMIUM PRO
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--text-muted)',
                      display: 'block',
                      marginTop: '0.1rem',
                    }}
                  >
                    Desbloqueie desdobramentos combinatórios e fechamentos
                    avançados
                  </span>
                </div>
              )}

              <ProfilePanel
                user={user}
                onSave={onSaveProfile}
                feedback={profileFeedback}
                loading={profileLoading}
                isPro={isPro}
                playSound={playSound}
                onDeleteAccount={onDeleteAccount}
                onSetShowInRanking={onSetShowInRanking}
                showInRanking={showInRanking}
                onSetEmailAlerts={onSetEmailAlerts}
                emailAlerts={emailAlerts}
                emailAlertFeedback=""
              />

              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  fontSize: '0.72rem',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Sair da Conta
              </button>
            </>
          ) : (
            <div
              style={{
                padding: '0.75rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Sua sessão não está ativa.
              </span>
              <a
                href="/login?next=/app"
                className="btn-action"
                style={{ textDecoration: 'none', fontSize: '0.75rem' }}
              >
                Entrar novamente
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
