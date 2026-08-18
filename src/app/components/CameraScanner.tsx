'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  preprocessImage,
  extractCandidateNumbers,
  normalizeDetectedNumbers,
  validateDetectedNumbers,
  type OCRProgress,
} from '@/lib/ocr';
import { LOTTERY_CONFIGS } from '@/lib/lottery-math';
import Tesseract from 'tesseract.js';

type InputMode = 'camera' | 'gallery' | 'manual';

interface CameraScannerProps {
  isOpen?: boolean;
  onClose: () => void;
  onNumbersDetected?: (numbers: string[]) => void;
  onDetected?: (numbers: number[], lotteryId: string) => void;
  activeLottery?: string;
}

const LOTTERY_OPTS = Object.entries(LOTTERY_CONFIGS).map(([id, c]) => ({
  id,
  name: c.name,
}));
const PROGRESS_PCT: Record<OCRProgress, number> = {
  preparing: 15,
  reading: 55,
  verifying: 85,
  done: 100,
  error: 0,
};
const PROGRESS_MSG: Record<OCRProgress, string> = {
  preparing: 'Preparando imagem…',
  reading: 'Lendo números…',
  verifying: 'Verificando…',
  done: 'Concluído!',
  error: 'Erro na leitura',
};

const pillColor = (lotteryId: string) =>
  LOTTERY_CONFIGS[lotteryId]?.accentColor ?? 'var(--accent-color)';

export default function CameraScanner({
  isOpen = true,
  onClose,
  onNumbersDetected,
  onDetected,
  activeLottery = 'megasena',
}: CameraScannerProps) {
  const [mode, setMode] = useState<InputMode>('manual');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [lottery, setLottery] = useState(activeLottery);
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resetState = useCallback(() => {
    setPreview(null);
    setFile(null);
    setNumbers([]);
    setProgress(null);
    setError('');
    setManualInput('');
    setMode('manual');
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    resetState();
    onClose();
  }, [stopCamera, resetState, onClose]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setNumbers([]);
    setError('');
  }, []);
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = '';
    },
    [handleFile]
  );

  const runOCR = useCallback(async () => {
    if (!file) return;
    setProgress('preparing');
    setError('');
    try {
      const dataUrl = await preprocessImage(file);
      setProgress('reading');
      const result = await Tesseract.recognize(dataUrl, 'eng');
      setProgress('verifying');
      const candidates = extractCandidateNumbers(result.data.text ?? '');
      const normalized = normalizeDetectedNumbers(candidates);
      const validation = validateDetectedNumbers(normalized, lottery);
      setNumbers(normalized);
      if (normalized.length === 0) {
        setError(
          'Nenhum número encontrado. Verifique a imagem ou use a aba Manual.'
        );
      } else if (!validation.valid) {
        setError(validation.errors.join(' '));
      }
      setProgress('done');
    } catch {
      setError('Erro ao processar imagem.');
      setProgress('error');
    }
  }, [file, lottery]);

  const removeNum = useCallback(
    (n: number) => setNumbers((p) => p.filter((x) => x !== n)),
    []
  );
  const addManual = useCallback(() => {
    const n = parseInt(manualInput, 10);
    if (isNaN(n)) return;
    setNumbers((p) => (p.includes(n) ? p : [...p, n].sort((a, b) => a - b)));
    setManualInput('');
  }, [manualInput]);

  const confirm = useCallback(() => {
    if (numbers.length === 0) return;
    const numStrs = numbers.map((n) => String(n).padStart(2, '0'));
    onNumbersDetected?.(numStrs);
    onDetected?.(numbers, lottery);
    onClose();
  }, [numbers, lottery, onNumbersDetected, onDetected, onClose]);

  if (!isOpen) return null;
  const maxNum = LOTTERY_CONFIGS[lottery]?.maxNum ?? 99;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Scanner de bilhetes"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 16,
          boxShadow: '0 0 40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <h3
            style={{
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontWeight: 700,
              margin: 0,
              fontFamily: 'var(--font-display)',
            }}
          >
            📷 Scanner
          </h3>
          <button
            style={{
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
            }}
            onClick={handleClose}
            aria-label="Fechar scanner"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1rem 1.25rem' }}>
          <div
            style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}
            role="tablist"
            aria-label="Modo de entrada"
          >
            {(
              [
                ['camera', '📸 Câmera'],
                ['gallery', '🖼 Galeria'],
                ['manual', '⌨ Manual'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  minHeight: 44,
                  borderRadius: 10,
                  border: `1px solid ${mode === m ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                  background:
                    mode === m
                      ? 'rgba(0,240,255,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  color:
                    mode === m ? 'var(--accent-color)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
                onClick={() => {
                  setMode(m);
                  setProgress(null);
                  setError('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {(mode === 'camera' || mode === 'gallery') && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture={mode === 'camera' ? 'environment' : undefined}
                style={{ display: 'none' }}
                onChange={onFileChange}
                aria-label={
                  mode === 'camera' ? 'Capturar foto' : 'Selecionar da galeria'
                }
              />

              {!preview ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <button
                    style={{
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
                      marginBottom: 8,
                    }}
                    onClick={() => fileRef.current?.click()}
                    aria-label={
                      mode === 'camera' ? 'Abrir câmera' : 'Abrir galeria'
                    }
                  >
                    {mode === 'camera' ? '📸 Tirar Foto' : '🖼 Escolher Imagem'}
                  </button>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {mode === 'camera'
                      ? 'Posicione o bilhete na área visível'
                      : 'Selecione uma foto do bilhete'}
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      border: '1px solid var(--glass-border)',
                      background: '#000',
                    }}
                  >
                    <img
                      src={preview}
                      alt="Prévia do bilhete"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>

                  {progress && (
                    <div style={{ marginBottom: '1rem' }} aria-live="polite">
                      <div
                        style={{
                          width: '100%',
                          height: 6,
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: `${PROGRESS_PCT[progress]}%`,
                            height: '100%',
                            background:
                              progress === 'error'
                                ? '#ff4466'
                                : 'var(--accent-color)',
                            borderRadius: 3,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                        }}
                      >
                        {PROGRESS_MSG[progress]}
                      </p>
                    </div>
                  )}

                  {(progress === null ||
                    progress === 'done' ||
                    progress === 'error') && (
                    <button
                      style={{
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
                        marginBottom: 8,
                      }}
                      onClick={runOCR}
                      aria-label="Iniciar leitura OCR"
                    >
                      {progress === 'done' || progress === 'error'
                        ? '🔄 Reler Números'
                        : '🔍 Ler Números (OCR)'}
                    </button>
                  )}

                  <button
                    style={{
                      width: '100%',
                      padding: 14,
                      minHeight: 52,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                    onClick={() => {
                      setPreview(null);
                      setFile(null);
                      setProgress(null);
                      setNumbers([]);
                      setError('');
                    }}
                    aria-label="Escolher outra imagem"
                  >
                    ✕ Trocar Imagem
                  </button>
                </>
              )}

              {error && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '0.75rem',
                    borderRadius: 10,
                    background: 'rgba(255,68,102,0.08)',
                    border: '1px solid rgba(255,68,102,0.2)',
                  }}
                  role="alert"
                  aria-live="assertive"
                >
                  <p
                    style={{
                      color: '#ff4466',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Dicas para melhor leitura:
                  </p>
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.7rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                    <br />• Boa iluminação, sem sombras
                    <br />• Aproxime o bilhete (preencha a tela)
                    <br />• Mantenha reto e sem reflexos
                    <br />• Se não funcionar, use a aba Manual
                  </p>
                </div>
              )}
            </>
          )}

          {mode === 'manual' && (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                marginBottom: '0.75rem',
              }}
            >
              Digite os números separados por espaço ou vírgula:
            </p>
          )}

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Loteria
            </span>
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                marginTop: 4,
                minHeight: 44,
                fontFamily: 'var(--font-body)',
              }}
              value={lottery}
              onChange={(e) => setLottery(e.target.value)}
              aria-label="Selecionar loteria"
            >
              {LOTTERY_OPTS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>

          {numbers.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
              aria-label="Números detectados"
              aria-live="polite"
            >
              {numbers.map((n) => {
                const c = pillColor(lottery);
                return (
                  <div
                    key={n}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `${c}22`,
                      border: `2px solid ${c}55`,
                      color: c,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-numbers)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <span>{String(n).padStart(2, '0')}</span>
                    <button
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#ff4466',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                      onClick={() => removeNum(n)}
                      aria-label={`Remover número ${n}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <input
              type="number"
              min={0}
              max={maxNum}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
              placeholder={`0–${String(maxNum).padStart(2, '0')}`}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                minHeight: 44,
                fontFamily: 'var(--font-body)',
              }}
              aria-label={`Adicionar número (0 a ${maxNum})`}
            />
            <button
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid var(--accent-color)',
                background: 'rgba(0,240,255,0.08)',
                color: 'var(--accent-color)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                minHeight: 44,
              }}
              onClick={addManual}
              aria-label="Adicionar número"
            >
              + Adicionar
            </button>
          </div>

          <button
            style={{
              width: '100%',
              padding: 14,
              minHeight: 52,
              borderRadius: 12,
              border: 'none',
              background:
                numbers.length === 0
                  ? 'rgba(255,255,255,0.05)'
                  : 'var(--accent-color)',
              color: numbers.length === 0 ? 'var(--text-muted)' : '#000',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: numbers.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)',
            }}
            disabled={numbers.length === 0}
            onClick={confirm}
            aria-label="Confirmar e usar números detectados"
          >
            ✓ Confirmar ({numbers.length} números)
          </button>
        </div>
      </div>
    </div>
  );
}
