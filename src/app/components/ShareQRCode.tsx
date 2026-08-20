'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string | null;
  shareUrl: string;
  gamesCount: number;
  lotteryName: string;
  cotas: number;
  taxa: number;
  onRevoke?: () => void;
}

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  panel: {
    maxWidth: 380,
    width: '92%',
    background: 'rgba(18,18,30,0.92)',
    backdropFilter: 'blur(18px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    color: '#e8e8f0',
    fontFamily: 'var(--font-body)',
    position: 'relative' as const,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  title: {
    textAlign: 'center' as const,
    fontSize: '1.05rem',
    fontWeight: 800,
    margin: '0 0 12px',
    background: 'linear-gradient(90deg,#ff007f,#ffd600)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  qrWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: '0.85rem',
  },
  urlBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '6px 10px',
    marginBottom: 10,
  },
  urlText: {
    flex: 1,
    fontSize: '0.78rem',
    color: '#bbb',
    wordBreak: 'break-all' as const,
  },
  btn: (bg: string, color = '#fff') => ({
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: bg,
    color,
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    flex: 1,
  }),
  copyBtn: (copied: boolean) => ({
    background: copied ? '#00c853' : 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: '0.75rem',
    color: copied ? '#000' : '#ccc',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.2s',
  }),
  statusBadge: (active: boolean) => ({
    fontSize: '0.8rem',
    fontWeight: 700,
    color: active ? '#00c853' : '#ff1744',
    background: active ? 'rgba(0,200,83,0.12)' : 'rgba(255,23,68,0.12)',
    padding: '3px 12px',
    borderRadius: 20,
  }),
  info: {
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 12,
    fontSize: '0.82rem',
    lineHeight: 1.7,
  },
  revokeOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  smallBtn: (bg: string, color: string) => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: bg === '#ff1744' ? 'none' : '1px solid rgba(255,255,255,0.15)',
    background: bg,
    color,
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
  }),
};

const fmtCurrency = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ShareQRCode({
  isOpen,
  onClose,
  shareCode,
  shareUrl,
  gamesCount,
  lotteryName,
  cotas,
  taxa,
  onRevoke,
}: Props) {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen || !shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#ffffff', light: '#00000000' },
    }).then((u) => {
      if (!cancelled) setDataUrl(u);
    });
    return () => {
      cancelled = true;
      setDataUrl('');
    };
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const isActive = shareCode != null;
  const trunc = (u: string, m = 48) =>
    u.length > m ? u.slice(0, m) + '...' : u;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };
  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${shareCode ?? 'bolao'}.png`;
    a.click();
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bolão ${lotteryName}`,
          text: `Confira os jogos do bolão ${lotteryName} (${gamesCount} jogos)`,
          url: shareUrl,
        });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  };

  return (
    <div
      style={S.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar bolão via QR Code"
      onClick={onClose}
    >
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>
        <button style={S.closeBtn} onClick={onClose} aria-label="Fechar">
          ✕
        </button>
        <h2 style={S.title}>Compartilhar Bolão</h2>

        <div style={S.qrWrap}>
          {dataUrl ? (
            <Image
              src={dataUrl}
              alt="QR Code para compartilhar bolão"
              width={200}
              height={200}
              unoptimized
              style={{ width: 200, height: 200, borderRadius: 8 }}
            />
          ) : (
            <div style={S.qrPlaceholder}>Gerando QR Code...</div>
          )}
        </div>

        <div style={S.urlBar}>
          <span style={S.urlText} title={shareUrl}>
            {trunc(shareUrl)}
          </span>
          <button
            onClick={copy}
            style={S.copyBtn(copied)}
            aria-label={copied ? 'Link copiado' : 'Copiar link'}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={S.statusBadge(isActive)}>
            {isActive ? '● Link ativo' : '● Link revogado'}
          </span>
        </div>

        <div className="glass-panel" style={S.info}>
          <div>
            <strong>Loteria:</strong> {lotteryName}
          </div>
          <div>
            <strong>Jogos:</strong> {gamesCount}
          </div>
          <div>
            <strong>Cotas:</strong> {cotas}
          </div>
          <div>
            <strong>Taxa:</strong> {taxa}%
            {taxa > 0 && ` (≈ ${fmtCurrency((taxa / 100) * gamesCount * 5)})`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={download}
              style={S.btn('rgba(255,255,255,0.07)', '#e8e8f0')}
              aria-label="Baixar QR Code como imagem"
            >
              Baixar QR
            </button>
            <button
              onClick={share}
              style={S.btn('linear-gradient(135deg,#ff007f,#7c4dff)')}
              aria-label="Compartilhar link do bolão"
            >
              Compartilhar
            </button>
          </div>
          {onRevoke && isActive && (
            <button
              onClick={() => setConfirm(true)}
              style={{
                ...S.btn('rgba(255,23,68,0.08)', '#ff6e7f'),
                flex: 'none',
                border: '1px solid rgba(255,23,68,0.4)',
              }}
              aria-label="Revogar link de compartilhamento"
            >
              Revogar link
            </button>
          )}
        </div>

        {confirm && (
          <div style={S.revokeOverlay}>
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Revogar o link?
            </p>
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: '0.82rem',
                color: '#aaa',
              }}
            >
              Participantes não conseguirão mais acessar o bolão por este link.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={S.smallBtn('rgba(255,255,255,0.07)', '#ccc')}
                aria-label="Cancelar revogação"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirm(false);
                  onRevoke?.();
                }}
                style={S.smallBtn('#ff1744', '#fff')}
                aria-label="Confirmar revogação do link"
              >
                Revogar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
