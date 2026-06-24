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
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.25rem',
                          justifyContent: 'center',
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
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
