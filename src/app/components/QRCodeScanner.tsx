'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { blockDangerousSchemes, validateShareUrl } from '@/lib/qr-share';

type InputMode = 'camera' | 'image';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (url: string) => void;
}

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    padding: '1rem',
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 16,
    boxShadow: '0 0 40px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--glass-border)',
  },
  title: {
    color: 'var(--text-main)',
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: 'var(--text-main)',
    borderRadius: '50%',
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: '1rem 1.25rem' },
  tab: (active: boolean) => ({
    flex: 1,
    padding: '10px 0',
    minHeight: 44,
    borderRadius: 10,
    border: `1px solid ${active ? 'var(--accent-color)' : 'var(--glass-border)'}`,
    background: active ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
    color: active ? 'var(--accent-color)' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  }),
  primaryBtn: {
    width: '100%',
    padding: 14,
    minHeight: 52,
    borderRadius: 12,
    border: '1px solid var(--accent-color)',
    background: 'rgba(0,240,255,0.1)',
    color: 'var(--accent-color)',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
  },
  errorBox: {
    marginTop: 8,
    padding: '0.75rem',
    borderRadius: 10,
    background: 'rgba(255,68,102,0.08)',
    border: '1px solid rgba(255,68,102,0.2)',
  },
};

export default function QRCodeScanner({
  isOpen,
  onClose,
  onScan,
}: QRCodeScannerProps) {
  const [mode, setMode] = useState<InputMode>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const html5Ref = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const cleanup = useCallback(async () => {
    const inst = html5Ref.current;
    if (inst) {
      try {
        await inst.stop();
      } catch {
        /* já parado */
      }
      try {
        inst.clear();
      } catch {
        /* ignore */
      }
      html5Ref.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleUrl = useCallback(
    (decodedText: string) => {
      if (blockDangerousSchemes(decodedText)) {
        setError('URL bloqueada por segurança. Esquema não permitido.');
        return;
      }
      const {
        safe,
        isMeuTrevo,
        displayUrl: cleanUrl,
      } = validateShareUrl(decodedText);
      if (!safe) {
        setError('URL inválida ou insegura.');
        return;
      }
      if (isMeuTrevo) {
        onScan(decodedText);
        onClose();
        return;
      }
      setDisplayUrl(cleanUrl);
      setPendingUrl(decodedText);
    },
    [onScan, onClose]
  );

  const startCamera = useCallback(async () => {
    if (!containerRef.current || html5Ref.current) return;
    setError('');
    try {
      const inst = new Html5Qrcode('qr-reader');
      html5Ref.current = inst;
      await inst.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (text) => handleUrl(text),
        () => {
          /* ignorar erros de frame */
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission'))
        setError(
          'Câmera negada. Permita o acesso nas configurações do navegador para escanear QR codes.'
        );
      else if (msg.includes('NotFoundError'))
        setError('Nenhuma câmera encontrada no dispositivo.');
      else setError('Erro ao iniciar câmera. Tente o modo de imagem.');
    }
  }, [handleUrl]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError('');
      try {
        const inst = new Html5Qrcode('qr-file-reader');
        const result = await inst.scanFile(file, true);
        inst.clear();
        handleUrl(result);
      } catch {
        setError(
          'Nenhum QR code encontrado na imagem. Tente outra foto mais nítida.'
        );
      }
      e.target.value = '';
    },
    [handleUrl]
  );

  const handleClose = useCallback(async () => {
    await cleanup();
    setPendingUrl(null);
    setDisplayUrl('');
    setError('');
    setMode('camera');
    onClose();
  }, [cleanup, onClose]);

  // Inicia câmera ao abrir
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      const t = setTimeout(() => startCamera(), 100);
      return () => clearTimeout(t);
    }
    return () => {
      cleanup();
    };
  }, [isOpen, mode, startCamera, cleanup]);

  const resetState = useCallback(() => {
    setPendingUrl(null);
    setDisplayUrl('');
    setError('');
    setMode('camera');
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    resetState();
    onClose();
  }, [cleanup, resetState, onClose]);

  // Cleanup no unmount
  useEffect(
    () => () => {
      cleanup();
    },
    [cleanup]
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scanner de QR Code"
      style={S.overlay}
    >
      <div style={S.panel}>
        <div style={S.header}>
          <h3 style={S.title}>📷 Scanner QR Code</h3>
          <button
            onClick={handleClose}
            aria-label="Fechar scanner"
            style={S.closeBtn}
          >
            ✕
          </button>
        </div>

        <div style={S.body}>
          {/* Abas */}
          <div
            style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}
            role="tablist"
            aria-label="Modo de entrada"
          >
            {(
              [
                ['camera', '📸 Câmera'],
                ['image', '🖼 Imagem'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError('');
                  setPendingUrl(null);
                }}
                style={S.tab(mode === m)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Modo câmera */}
          {mode === 'camera' && !pendingUrl && (
            <div style={{ textAlign: 'center' }}>
              <div
                id="qr-reader"
                ref={containerRef}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#000',
                  minHeight: 200,
                  marginBottom: '0.75rem',
                  border: isScanning
                    ? '2px solid var(--accent-color)'
                    : '2px solid var(--glass-border)',
                  animation: isScanning
                    ? 'qrPulse 1.5s ease-in-out infinite'
                    : 'none',
                }}
              />
              {isScanning && (
                <p
                  style={{
                    color: 'var(--accent-color)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                  aria-live="polite"
                >
                  Escaneando...
                </p>
              )}
            </div>
          )}

          {/* Modo imagem */}
          {mode === 'image' && !pendingUrl && (
            <div style={{ textAlign: 'center' }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                aria-label="Selecionar imagem com QR code"
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={S.primaryBtn}
              >
                🖼 Escolher Imagem
              </button>
              <p
                style={{
                  marginTop: 8,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                Selecione uma foto com QR code
              </p>
            </div>
          )}

          {/* Confirmação de URL desconhecida */}
          {pendingUrl && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <p
                style={{
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                URL detectada:
              </p>
              <p
                style={{
                  color: 'var(--accent-color)',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                  padding: '0.75rem',
                  borderRadius: 10,
                  background: 'rgba(0,240,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  marginBottom: '1rem',
                }}
              >
                {displayUrl}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setPendingUrl(null);
                    setDisplayUrl('');
                  }}
                  aria-label="Cancelar"
                  style={{
                    flex: 1,
                    padding: 14,
                    minHeight: 48,
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onScan(pendingUrl);
                    handleClose();
                  }}
                  aria-label="Abrir link"
                  style={{
                    flex: 1,
                    padding: 14,
                    minHeight: 48,
                    borderRadius: 12,
                    border: 'none',
                    background: 'var(--accent-color)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Abrir Link
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={S.errorBox} role="alert" aria-live="assertive">
              <p
                style={{
                  color: '#ff4466',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Div oculto para scanFile (html5-qrcode requer um elemento DOM) */}
      <div
        id="qr-file-reader"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          opacity: 0,
        }}
      />

      <style>{`
        @keyframes qrPulse {
          0%, 100% { border-color: var(--accent-color); box-shadow: 0 0 8px var(--accent-glow, rgba(0,240,255,0.3)); }
          50% { border-color: rgba(0,240,255,0.4); box-shadow: 0 0 20px var(--accent-glow, rgba(0,240,255,0.6)); }
        }
      `}</style>
    </div>
  );
}
