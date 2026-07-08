'use client';

import { useState } from 'react';
import type { User } from '../types';
import { LOTTERY_CONFIGS } from '../../lib/lottery-math';

const AVATARS = ['👤', '🎰', '🍀', '🎯', '🧠', '🦊', '🐉', '🌟', '⚡', '🔮'];
const UFS = [
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

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--glass-border)',
  borderRadius: '4px',
  color: 'white',
  fontSize: '0.65rem',
  padding: '0.25rem 0.4rem',
  width: '100%',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '0.1rem',
};
const sectionTitle: React.CSSProperties = {
  fontSize: '0.55rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '0.4rem',
  fontWeight: 600,
};
const sectionStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

interface ProfilePanelProps {
  user: User;
  onSave: (data: {
    name: string;
    password: string;
    avatar: string;
    favorite_lottery: string;
    cpf_cnpj: string;
    city: string;
    state: string;
  }) => Promise<void>;
  feedback: string;
  loading: boolean;
  isPro: boolean;
  playSound: (type: 'click' | 'success' | 'delete') => void;
  onDeleteAccount: () => void;
  onSetShowInRanking: (v: boolean) => void;
  showInRanking: boolean;
  onSetEmailAlerts: (v: boolean) => void;
  emailAlerts: boolean;
  emailAlertFeedback: string;
}

export default function ProfilePanel({
  user,
  onSave,
  feedback,
  loading,
  playSound,
  onDeleteAccount,
  onSetShowInRanking,
  showInRanking,
  onSetEmailAlerts,
  emailAlerts,
  emailAlertFeedback,
}: ProfilePanelProps) {
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(user.avatar || '👤');
  const [favLottery, setFavLottery] = useState(
    user.favorite_lottery || 'megasena'
  );
  const [cpfCnpj, setCpfCnpj] = useState(user.cpf_cnpj || '');
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      password,
      avatar,
      favorite_lottery: favLottery,
      cpf_cnpj: cpfCnpj,
      city,
      state,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          background: 'rgba(255,255,255,0.01)',
          borderRadius: '10px',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(0,240,255,0.03)',
          }}
        >
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--accent-color)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            👤 Editar Dados
          </span>
          {feedback && (
            <span
              style={{
                fontSize: '0.6rem',
                color: feedback.includes('✓') ? '#00e676' : '#ff1744',
                fontWeight: 'bold',
              }}
            >
              {feedback}
            </span>
          )}
        </div>

        {/* Avatar + Name */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Identidade</div>
          <div
            style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '1.5rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatar}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.2rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setAvatar(av);
                    }}
                    style={{
                      fontSize: '0.65rem',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background:
                        avatar === av
                          ? 'var(--accent-color)'
                          : 'rgba(0,0,0,0.3)',
                      border:
                        avatar === av
                          ? '1px solid var(--accent-color)'
                          : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      padding: 0,
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}
            >
              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  style={{
                    ...inputStyle,
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed',
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Segurança</div>
          <label style={labelStyle}>
            Nova senha{' '}
            <span style={{ opacity: 0.5 }}>(deixe vazio para manter)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
          />
        </div>

        {/* Personal Info: CPF, City, State */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Documentos</div>
          <label style={labelStyle}>CPF/CNPJ</label>
          <input
            type="text"
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            placeholder="Obrigatório para pagamentos"
            style={inputStyle}
          />
          <span
            style={{
              fontSize: '0.5rem',
              color: 'rgba(255,255,255,0.25)',
              display: 'block',
              marginTop: '0.15rem',
            }}
          >
            Pertence a quem vai pagar o Pix.
          </span>
        </div>

        <div style={sectionStyle}>
          <div style={sectionTitle}>Localização</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Sua cidade"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Estado</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  ...inputStyle,
                  background: 'rgba(0,0,0,0.4)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: '#111' }}>
                  UF
                </option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf} style={{ background: '#111' }}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Preferências</div>
          <label style={labelStyle}>Loteria Favorita</label>
          <select
            value={favLottery}
            onChange={(e) => setFavLottery(e.target.value)}
            style={{
              ...inputStyle,
              background: 'rgba(0,0,0,0.4)',
              outline: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {Object.entries(LOTTERY_CONFIGS).map(([id, cfg]) => (
              <option key={id} value={id} style={{ background: '#111' }}>
                {cfg.name}
              </option>
            ))}
          </select>

          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
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
                checked={emailAlerts}
                onChange={() => onSetEmailAlerts(!emailAlerts)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--accent-color)',
                }}
              />
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                📧 Alertas por E-mail
              </span>
            </label>
            {emailAlertFeedback && (
              <span
                style={{
                  fontSize: '0.6rem',
                  color: '#00e676',
                  fontWeight: 'bold',
                }}
              >
                {emailAlertFeedback}
              </span>
            )}

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
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--accent-color)',
                }}
              />
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                🏆 Aparecer no Ranking
              </span>
            </label>
          </div>
        </div>

        {/* Save */}
        <div style={{ padding: '0.6rem 0.75rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--accent-color)',
              border: 'none',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              padding: '0.5rem',
              borderRadius: '6px',
              width: '100%',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 10px var(--accent-glow)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div
        style={{
          background: 'rgba(255,23,68,0.05)',
          border: '1px solid rgba(255,23,68,0.2)',
          borderRadius: '10px',
          padding: '0.65rem',
        }}
      >
        <div
          style={{
            fontSize: '0.55rem',
            color: '#ff1744',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 700,
            marginBottom: '0.3rem',
          }}
        >
          ⚠️ Zona de Perigo
        </div>
        <p
          style={{
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
            margin: '0 0 0.4rem',
          }}
        >
          Excluir sua conta removerá todos os dados permanentemente.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => {
              playSound('click');
              setConfirmDelete(true);
            }}
            style={{
              background: 'rgba(255,23,68,0.15)',
              border: '1px solid #ff1744',
              color: '#ff1744',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Excluir Conta
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => {
                playSound('delete');
                onDeleteAccount();
              }}
              style={{
                flex: 1,
                background: '#ff1744',
                border: 'none',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '0.4rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Confirmar Exclusão
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.65rem',
                padding: '0.4rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
