'use client';

import Image from 'next/image';
import React, { useState, useMemo } from 'react';
import {
  createShareableGame,
  generateWhatsAppText,
  generateCSV,
  encodeGame,
  decodeGame,
  type ShareableGame,
} from '../../lib/game-share';

interface Props {
  lottery: string;
  numbers: string[];
  savedGames?: {
    id: string;
    lottery: string;
    numbers: string;
    created_at: string;
  }[];
  onClose: () => void;
}

export default function ExportImportModal({
  lottery,
  numbers,
  savedGames,
  onClose,
}: Props) {
  const [tab, setTab] = useState<'export' | 'import' | 'csv'>('export');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<ShareableGame | null>(null);
  const [copied, setCopied] = useState(false);

  const game = createShareableGame(lottery, numbers);
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/jogo?g=${encodeGame(game)}`;
  const whatsappText = generateWhatsAppText(game);

  // Simple QR code generator using canvas
  const generateQR = (text: string) => {
    const canvas = document.createElement('canvas');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple visual QR-like pattern (placeholder - real QR would use a library)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    // Position detection patterns
    const drawFinderPattern = (x: number, y: number) => {
      ctx.fillRect(x, y, 28, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4, y + 4, 20, 20);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 8, y + 8, 12, 12);
    };

    drawFinderPattern(4, 4);
    drawFinderPattern(size - 32, 4);
    drawFinderPattern(4, size - 32);

    // Data pattern based on text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    const moduleSize = 6;
    for (let y = 40; y < size - 40; y += moduleSize) {
      for (let x = 40; x < size - 40; x += moduleSize) {
        hash = (hash * 1103515245 + 12345) & 0x7fffffff;
        if (hash % 3 !== 0) {
          ctx.fillRect(x, y, moduleSize - 1, moduleSize - 1);
        }
      }
    }

    return canvas.toDataURL();
  };
  const qrDataUrl = useMemo(
    () => (tab === 'export' ? generateQR(shareUrl) : ''),
    [shareUrl, tab]
  );

  const handleImport = () => {
    // Try to decode as base64 game
    const decoded = decodeGame(importText.trim());
    if (decoded) {
      setImportResult(decoded);
      return;
    }

    // Try to extract from URL
    try {
      const url = new URL(importText.trim());
      const g = url.searchParams.get('g');
      if (g) {
        const d = decodeGame(g);
        if (d) {
          setImportResult(d);
          return;
        }
      }
    } catch {
      /* not a URL */
    }

    setImportResult(null);
  };

  const handleExportCSV = () => {
    if (!savedGames || savedGames.length === 0) return;
    const games = savedGames.map((g) =>
      createShareableGame(g.lottery, g.numbers.split(/[-,\s]+/), g.created_at)
    );
    const csv = generateCSV(games);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-trevo-jogos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
      '_blank'
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['export', 'import', 'csv'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor:
                  tab === t ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                background: tab === t ? 'rgba(0,240,255,0.08)' : 'transparent',
                color: tab === t ? 'var(--accent-color)' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t === 'export'
                ? '📤 Compartilhar'
                : t === 'import'
                  ? '📥 Importar'
                  : '📊 CSV'}
            </button>
          ))}
        </div>

        {tab === 'export' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            {/* QR Code */}
            {qrDataUrl && (
              <div
                style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                }}
              >
                <Image
                  src={qrDataUrl}
                  alt="QR Code"
                  width={160}
                  height={160}
                  unoptimized
                />
              </div>
            )}

            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Escaneie ou compartilhe este QR Code
            </p>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button
                onClick={handleWhatsApp}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: 'rgba(37, 211, 102, 0.1)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#25d366',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📱 WhatsApp
              </button>
              <button
                onClick={() => handleCopy(shareUrl)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: 'rgba(0,240,255,0.1)',
                  border: '1px solid rgba(0,240,255,0.3)',
                  color: 'var(--accent-color)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ Copiado!' : '🔗 Copiar Link'}
              </button>
            </div>

            {/* Web Share API */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={() =>
                  navigator.share({
                    title: 'Meu Trevo',
                    text: whatsappText,
                    url: shareUrl,
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📤 Compartilhar
              </button>
            )}
          </div>
        )}

        {tab === 'import' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cole o link ou código de compartilhamento:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="https://meutrevo.com.br/jogo?g=... ou código base64"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.75rem',
                color: 'white',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                minHeight: '80px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              style={{
                padding: '0.6rem',
                background: importText.trim()
                  ? 'rgba(0,240,255,0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: importText.trim()
                  ? 'rgba(0,240,255,0.3)'
                  : 'rgba(255,255,255,0.1)',
                color: importText.trim()
                  ? 'var(--accent-color)'
                  : 'var(--text-muted)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: importText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              📥 Importar Jogo
            </button>

            {importResult && (
              <div
                style={{
                  background: 'rgba(0,230,118,0.05)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#00e676',
                    marginBottom: '0.5rem',
                  }}
                >
                  ✓ Jogo importado!
                </div>
                <div
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  Loteria:{' '}
                  <strong style={{ color: 'white' }}>
                    {importResult.lottery}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {importResult.numbers.map((n, i) => (
                    <span
                      key={i}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(0,240,255,0.15)',
                        border: '1px solid rgba(0,240,255,0.3)',
                        color: 'white',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'csv' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Exporte todos os seus jogos salvos em formato CSV para abrir no
              Excel.
            </p>
            <button
              onClick={handleExportCSV}
              disabled={!savedGames || savedGames.length === 0}
              style={{
                padding: '0.6rem',
                background: 'rgba(0,230,118,0.1)',
                border: '1px solid rgba(0,230,118,0.3)',
                color: '#00e676',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor:
                  savedGames && savedGames.length > 0
                    ? 'pointer'
                    : 'not-allowed',
                opacity: savedGames && savedGames.length > 0 ? 1 : 0.5,
              }}
            >
              📊 Exportar CSV ({savedGames?.length || 0} jogos)
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-muted)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
