'use client';

import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/fetch';
import type { AdminStats, AdminUser } from '../types';

interface AdminPanelProps {
  adminStats: AdminStats;
  adminUsersList: AdminUser[];
  priceMonthly: number;
  priceAnnualEquivalent: number;
  adminFeedback: string;
  onSetAdminFeedback: (v: string) => void;
  onRefresh: () => void;
  playSound: (type: 'click' | 'success' | 'delete') => void;
}

export default function AdminPanel({
  adminStats,
  adminUsersList,
  priceMonthly,
  priceAnnualEquivalent,
  adminFeedback,
  onSetAdminFeedback,
  onRefresh,
  playSound,
}: AdminPanelProps) {
  const [adminSearch, setSearch] = useState('');
  const [localMonthly, setLocalMonthly] = useState(priceMonthly);
  const [localAnnual, setLocalAnnual] = useState(priceAnnualEquivalent);

  // E-mail system states
  const [emailUserId, setEmailUserId] = useState<string | null>(null);
  const [emailUserName, setEmailUserName] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const handleUpdatePrice = async (key: string, value: string) => {
    try {
      const res = await fetchWithCsrf('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        playSound('success');
        onSetAdminFeedback('Tarifa atualizada com sucesso!');
        setTimeout(() => onSetAdminFeedback(''), 3000);
        onRefresh();
      } else {
        const data = await res.json();
        onSetAdminFeedback(`Erro: ${data.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onSetAdminFeedback(`Erro: ${msg}`);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetchWithCsrf('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      if (res.ok) {
        playSound('success');
        onSetAdminFeedback('Nível do usuário atualizado!');
        setTimeout(() => onSetAdminFeedback(''), 3000);
        onRefresh();
      } else {
        const data = await res.json();
        onSetAdminFeedback(`Erro: ${data.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onSetAdminFeedback(`Erro: ${msg}`);
    }
  };

  const handleToggleUserBlock = async (
    userId: string,
    currentBlocked: boolean
  ) => {
    try {
      const res = await fetchWithCsrf('/api/admin/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, blocked: !currentBlocked }),
      });
      if (res.ok) {
        playSound('success');
        onSetAdminFeedback(
          !currentBlocked
            ? 'Usuário suspenso com sucesso!'
            : 'Usuário desbloqueado!'
        );
        setTimeout(() => onSetAdminFeedback(''), 3000);
        onRefresh();
      } else {
        const data = await res.json();
        onSetAdminFeedback(`Erro: ${data.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onSetAdminFeedback(`Erro: ${msg}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir PERMANENTEMENTE o usuário "${userName}" e todos os seus dados? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      const res = await fetchWithCsrf('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        playSound('delete');
        onSetAdminFeedback('Usuário excluído permanentemente!');
        setTimeout(() => onSetAdminFeedback(''), 3000);
        onRefresh();
      } else {
        const data = await res.json();
        onSetAdminFeedback(`Erro: ${data.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onSetAdminFeedback(`Erro: ${msg}`);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailUserId || !emailSubject || !emailMessage) return;

    setSendingEmail(true);
    try {
      const res = await fetchWithCsrf('/api/admin/users/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: emailUserId,
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      if (res.ok) {
        playSound('success');
        onSetAdminFeedback(`E-mail enviado para ${emailUserName}!`);
        setTimeout(() => onSetAdminFeedback(''), 3000);
        // Reset
        setEmailUserId(null);
        setEmailUserName('');
        setEmailSubject('');
        setEmailMessage('');
      } else {
        const data = await res.json();
        onSetAdminFeedback(`Erro: ${data.error}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      onSetAdminFeedback(`Erro: ${msg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '0.5rem 0',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: '120px',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Usuários
          </div>
          <strong
            style={{
              fontSize: '1.5rem',
              color: 'var(--accent-color)',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {adminStats.totalUsers}
          </strong>
        </div>
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: '120px',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            PRO Ativos
          </div>
          <strong
            style={{
              fontSize: '1.5rem',
              color: '#00e676',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {adminStats.proUsers}
          </strong>
        </div>
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: '120px',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Admins
          </div>
          <strong
            style={{
              fontSize: '1.5rem',
              color: '#ff007f',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {adminStats.adminUsers}
          </strong>
        </div>
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: '120px',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Free
          </div>
          <strong
            style={{
              fontSize: '1.5rem',
              color: 'var(--text-muted)',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {adminStats.freeUsers}
          </strong>
        </div>
      </div>

      {adminFeedback && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem',
            textAlign: 'center',
            color: adminFeedback.startsWith('⚠️')
              ? '#ff1744'
              : adminFeedback.startsWith('⏳')
                ? '#ffd600'
                : '#00e676',
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        >
          {adminFeedback}
        </div>
      )}

      <div
        className="glass-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <h3
          style={{
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            color: 'white',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '0.35rem',
          }}
        >
          ⚙️ CONFIGURAÇÕES GLOBAIS
        </h3>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Preço Mensal (R$)
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="number"
                step="0.01"
                value={localMonthly}
                onChange={(e) =>
                  setLocalMonthly(parseFloat(e.target.value) || 0)
                }
                style={{
                  width: '80px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '0.4rem',
                }}
              />
              <button
                onClick={() =>
                  handleUpdatePrice('price_monthly', String(localMonthly))
                }
                style={{
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Salvar
              </button>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Preço Anual Total (R$)
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <input
                type="number"
                step="0.01"
                value={localAnnual}
                onChange={(e) =>
                  setLocalAnnual(parseFloat(e.target.value) || 0)
                }
                style={{
                  width: '80px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '0.4rem',
                }}
              />
              <button
                onClick={() =>
                  handleUpdatePrice('price_annual', String(localAnnual))
                }
                style={{
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <h3
          style={{
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            color: 'white',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '0.35rem',
          }}
        >
          🗄️ CACHE DE SORTEIOS
        </h3>
        <p
          style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}
        >
          Pré-carrega os 100 últimos concursos de cada loteria no banco de
          dados.
        </p>
        <button
          className="btn-action"
          style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1.25rem',
            fontSize: '0.82rem',
            background: 'linear-gradient(90deg,#00f0ff22,#00f0ff44)',
            border: '1px solid #00f0ff55',
            color: '#00f0ff',
            fontWeight: 700,
          }}
          onClick={async () => {
            onSetAdminFeedback(
              '⏳ Populando cache... isso pode levar 1-2 minutos.'
            );
            try {
              const r = await fetchWithCsrf('/api/admin/seed-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 100 }),
              });
              const d = await r.json();
              if (r.ok && d.success) {
                const { totalFetched, totalSkipped, totalErrors } = d.summary;
                onSetAdminFeedback(
                  `✓ Cache populado! Novos: ${totalFetched} | Já existiam: ${totalSkipped} | Erros: ${totalErrors}`
                );
                playSound('success');
              } else {
                onSetAdminFeedback(`⚠️ ${d.error || 'Erro ao popular cache'}`);
              }
            } catch {
              onSetAdminFeedback('⚠️ Erro de conexão ao popular cache');
            }
            setTimeout(() => onSetAdminFeedback(''), 8000);
          }}
        >
          🚀 Popular Cache (100 concursos × 5 loterias)
        </button>
      </div>

      <div
        className="glass-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '0.35rem',
          }}
        >
          <h3
            style={{
              fontSize: '0.85rem',
              fontFamily: 'var(--font-body)',
              color: 'white',
            }}
          >
            👥 USUÁRIOS CADASTRADOS ({adminUsersList.length})
          </h3>
          <input
            type="text"
            placeholder="🔍 Buscar nome ou email..."
            value={adminSearch}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '0.7rem',
              padding: '0.3rem 0.6rem',
              width: '180px',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nome</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>E-mail</th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>
                  Função (Role)
                </th>
                <th style={{ padding: '0.5rem', textAlign: 'center' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {adminUsersList
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(adminSearch.toLowerCase())
                )
                .map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <td
                      style={{
                        padding: '0.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {u.name}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{u.email}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.62rem',
                            background:
                              u.role === 'admin'
                                ? 'rgba(255, 0, 127, 0.15)'
                                : u.role === 'pro'
                                  ? 'rgba(0, 230, 118, 0.15)'
                                  : 'rgba(255,255,255,0.05)',
                            color:
                              u.role === 'admin'
                                ? '#ff007f'
                                : u.role === 'pro'
                                  ? '#00e676'
                                  : 'var(--text-muted)',
                            border:
                              u.role === 'admin'
                                ? '1px solid #ff007f'
                                : u.role === 'pro'
                                  ? '1px solid #00e676'
                                  : '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          {u.role.toUpperCase()}
                        </span>
                        {u.blocked && (
                          <span
                            style={{
                              padding: '0.1rem 0.3rem',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '0.55rem',
                              background: 'rgba(255, 23, 68, 0.2)',
                              color: '#ff1744',
                              border: '1px solid #ff1744',
                            }}
                          >
                            SUSPENSO 🚫
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() =>
                            handleUpdateUserRole(
                              u.id,
                              u.role === 'pro' ? 'free' : 'pro'
                            )
                          }
                          style={{
                            background: 'rgba(0, 230, 118, 0.1)',
                            border: '1px solid #00e676',
                            color: '#00e676',
                            fontSize: '0.62rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          {u.role === 'pro' ? 'Remover PRO' : 'Ativar PRO'}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateUserRole(
                              u.id,
                              u.role === 'admin' ? 'free' : 'admin'
                            )
                          }
                          style={{
                            background: 'rgba(255, 0, 127, 0.1)',
                            border: '1px solid #ff007f',
                            color: '#ff007f',
                            fontSize: '0.62rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          {u.role === 'admin' ? 'Remover Admin' : 'Fazer Admin'}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleUserBlock(u.id, !!u.blocked)
                          }
                          style={{
                            background: u.blocked
                              ? 'rgba(255, 152, 0, 0.15)'
                              : 'rgba(255, 23, 68, 0.1)',
                            border: u.blocked
                              ? '1px solid #ff9800'
                              : '1px solid #ff1744',
                            color: u.blocked ? '#ff9800' : '#ff1744',
                            fontSize: '0.62rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          {u.blocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                        <button
                          onClick={() => {
                            setEmailUserId(u.id);
                            setEmailUserName(u.name);
                          }}
                          style={{
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid #00f0ff',
                            color: '#00f0ff',
                            fontSize: '0.62rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          E-mail
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          style={{
                            background: 'rgba(211, 47, 47, 0.2)',
                            border: '1px solid #d32f2f',
                            color: '#ff5252',
                            fontSize: '0.62rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {emailUserId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(8, 8, 15, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleSendEmail}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem',
              boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '0.5rem',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', color: 'white', margin: 0 }}>
                📧 Enviar E-mail para {emailUserName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEmailUserId(null);
                  setEmailUserName('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Assunto
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Atualização na sua conta Meu Trevo"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '0.5rem',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Mensagem
              </label>
              <textarea
                required
                rows={6}
                placeholder="Escreva sua mensagem aqui..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '0.5rem',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div
              style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              <button
                type="button"
                onClick={() => {
                  setEmailUserId(null);
                  setEmailUserName('');
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                style={{
                  flex: 1.5,
                  background: 'var(--accent-color)',
                  border: 'none',
                  color: 'black',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  opacity: sendingEmail ? 0.6 : 1,
                }}
              >
                {sendingEmail ? 'Enviando... ⏳' : 'Enviar E-mail ⚡'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
