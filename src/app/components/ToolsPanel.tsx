'use client';

import React, { useState } from 'react';

interface Props {
  playSound: (type: 'click' | 'success' | 'delete') => void;
}

export default function ToolsPanel({ playSound }: Props) {
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>(() =>
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'default'
    );
  const [notifEnabled, setNotifEnabled] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('meu-trevo-notif-enabled') === 'true'
      : false
  );
  const [notifLotteries] = useState<string[]>(['megasena', 'lotofacil']);
  const [backupMsg, setBackupMsg] = useState('');

  const handleToggleNotif = async () => {
    playSound('click');
    if (!('Notification' in window)) {
      setBackupMsg('⚠️ Seu navegador não suporta notificações');
      return;
    }

    if (notifPermission !== 'granted') {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== 'granted') {
        setBackupMsg('⚠️ Permissão de notificação negada');
        return;
      }
    }

    const newState = !notifEnabled;
    setNotifEnabled(newState);
    localStorage.setItem('meu-trevo-notif-enabled', String(newState));

    if (newState) {
      new Notification('Meu Trevo 🍀', {
        body: 'Notificações ativadas! Você será avisado quando saírem resultados.',
        icon: '/trevo.png',
      });
    }
    setBackupMsg(
      newState ? '✓ Notificações ativadas' : 'Notificações desativadas'
    );
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleBackupExport = () => {
    playSound('success');
    const data = {
      version: 1,
      date: new Date().toISOString(),
      savedGames: JSON.parse(
        localStorage.getItem('meu-trevo-saved-games') || '[]'
      ),
      bets: JSON.parse(localStorage.getItem('meu-trevo-bets') || '[]'),
      settings: {
        notifEnabled,
        notifLotteries,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meu-trevo-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMsg('✓ Backup exportado com sucesso!');
    setTimeout(() => setBackupMsg(''), 3000);
  };

  const handleBackupImport = () => {
    playSound('click');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.savedGames)
            localStorage.setItem(
              'meu-trevo-saved-games',
              JSON.stringify(data.savedGames)
            );
          if (data.bets)
            localStorage.setItem('meu-trevo-bets', JSON.stringify(data.bets));
          setBackupMsg('✓ Backup restaurado! Recarregando...');
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          setBackupMsg('⚠️ Arquivo de backup inválido');
          setTimeout(() => setBackupMsg(''), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.25rem',
      }}
    >
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0,
          }}
        >
          🛠️ FERRAMENTAS
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.2rem',
          }}
        >
          Notificações, backup e configurações.
        </p>
      </div>

      {/* Notificações */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '0.75rem',
        }}
      >
        <h4
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 0.5rem 0',
          }}
        >
          🔔 Notificações
        </h4>
        <div
          style={{
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          Ative para receber alertas quando saírem novos resultados das loterias
          que você acompanha.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            onClick={handleToggleNotif}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              cursor: 'pointer',
              position: 'relative',
              background: notifEnabled
                ? 'rgba(0,230,118,0.3)'
                : 'rgba(255,255,255,0.1)',
              border: `1px solid ${notifEnabled ? '#00e676' : 'rgba(255,255,255,0.15)'}`,
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                background: notifEnabled ? '#00e676' : 'rgba(255,255,255,0.3)',
                left: notifEnabled ? '22px' : '2px',
                transition: 'all 0.2s',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              color: notifEnabled ? '#00e676' : 'var(--text-muted)',
            }}
          >
            {notifEnabled ? 'Ativadas' : 'Desativadas'}
          </span>
        </div>
        {notifPermission === 'denied' && (
          <div
            style={{
              fontSize: '0.5rem',
              color: '#ff4466',
              marginTop: '0.3rem',
            }}
          >
            Permissão negada. Habilite nas configurações do navegador.
          </div>
        )}
      </div>

      {/* Backup */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '0.75rem',
        }}
      >
        <h4
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 0.5rem 0',
          }}
        >
          💾 Backup e Restauração
        </h4>
        <div
          style={{
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          Exporte seus jogos salvos e apostas para um arquivo JSON. Use para
          migrar entre dispositivos ou restaurar dados.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleBackupExport}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(0,240,255,0.2)',
              background: 'rgba(0,240,255,0.08)',
              color: 'var(--accent-color)',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📥 Exportar Backup
          </button>
          <button
            onClick={handleBackupImport}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,214,0,0.2)',
              background: 'rgba(255,214,0,0.08)',
              color: '#ffd600',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📤 Restaurar Backup
          </button>
        </div>
      </div>

      {backupMsg && (
        <div
          style={{
            fontSize: '0.7rem',
            color: backupMsg.startsWith('✓') ? '#00e676' : '#ffd600',
            textAlign: 'center',
            padding: '0.4rem',
            borderRadius: '6px',
            background: backupMsg.startsWith('✓')
              ? 'rgba(0,230,118,0.08)'
              : 'rgba(255,214,0,0.08)',
          }}
        >
          {backupMsg}
        </div>
      )}
    </div>
  );
}
