'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { extractLotteryNumbers } from '@/lib/scanner-utils';

interface Props {
  onNumbersDetected: (numbers: string[]) => void;
  onClose: () => void;
}

interface BarcodeDetectionResultLike {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectionResultLike[]>;
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: {
    formats?: string[];
  }) => BarcodeDetectorLike;
}

export default function CameraScanner({ onNumbersDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const [detectedNumbers, setDetectedNumbers] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (err) {
      setError('Câmera não disponível. Use a entrada manual abaixo.');
      console.warn('[Camera]', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Try BarcodeDetector API (Chrome/Edge)
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !isActive) return;

    // Check if BarcodeDetector is available
    const browserWindow = window as WindowWithBarcodeDetector;
    if (browserWindow.BarcodeDetector) {
      try {
        const detector = new browserWindow.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128'],
        });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue ?? '';
          const nums = extractLotteryNumbers(value);
          if (nums.length > 0) {
            setDetectedNumbers(nums);
          }
        }
      } catch {
        /* detection failed, try again */
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      void scanFrame().finally(() => {
        if (!cancelled) requestAnimationFrame(loop);
      });
    };

    loop();
    return () => {
      cancelled = true;
    };
  }, [isActive, scanFrame]);

  const handleManualSubmit = () => {
    const nums = extractLotteryNumbers(manualInput);
    if (nums.length > 0) {
      onNumbersDetected(nums);
      stopCamera();
    }
  };

  const handleOcr = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || ocrBusy) return;

    setOcrBusy(true);
    setError('Lendo os números da imagem...');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setOcrBusy(false);
      setError('Não foi possível preparar a imagem para leitura.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng');
      try {
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });
        const result = await worker.recognize(canvas);
        const numbers = extractLotteryNumbers(result.data.text);

        if (numbers.length === 0) {
          setDetectedNumbers([]);
          setError(
            'Nenhum número foi identificado. Aproxime e tente novamente.'
          );
        } else {
          setDetectedNumbers(numbers);
          setError(
            `${numbers.length} número(s) identificado(s). Confira antes de usar.`
          );
        }
      } finally {
        await worker.terminate();
      }
    } catch (ocrError) {
      console.error('[Camera OCR]', ocrError);
      setError(
        'Não foi possível ler a imagem. Tente com mais luz ou digite os números.'
      );
    } finally {
      setOcrBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10001,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          📷 Conferir / Escanear
        </h3>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Camera view */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          playsInline
          muted
        />

        {!isActive && !error && (
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <button
              onClick={startCamera}
              style={{
                padding: '1rem 2rem',
                background: 'rgba(0,240,255,0.15)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: 'var(--accent-color)',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📸 Abrir Câmera
            </button>
          </div>
        )}

        {/* Scan overlay */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              inset: '20%',
              border: '2px solid rgba(0,240,255,0.5)',
              borderRadius: '12px',
              boxShadow: '0 0 30px rgba(0,240,255,0.1)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                height: '2px',
                background: 'var(--accent-color)',
                animation: 'scan-line 2s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div
        style={{
          padding: '1rem',
          background: 'var(--bg-primary)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {error && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#ffd600',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        {/* Detected numbers */}
        {detectedNumbers.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem',
              marginBottom: '0.75rem',
              justifyContent: 'center',
            }}
          >
            {detectedNumbers.map((n, i) => (
              <span
                key={i}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0,230,118,0.15)',
                  border: '1px solid rgba(0,230,118,0.3)',
                  color: '#00e676',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {n}
              </span>
            ))}
            <button
              onClick={() => onNumbersDetected(detectedNumbers)}
              style={{
                marginLeft: '0.5rem',
                padding: '0 0.75rem',
                background: 'rgba(0,230,118,0.15)',
                border: '1px solid rgba(0,230,118,0.3)',
                color: '#00e676',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✓ Usar
            </button>
          </div>
        )}

        {/* Camera controls */}
        {isActive && (
          <div
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}
          >
            <button
              onClick={handleOcr}
              disabled={ocrBusy}
              style={{
                flex: 1,
                padding: '0.6rem',
                background: 'rgba(0,240,255,0.1)',
                border: '1px solid rgba(0,240,255,0.2)',
                color: 'var(--accent-color)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {ocrBusy ? 'Lendo...' : 'Ler números (OCR)'}
            </button>
            <button
              onClick={stopCamera}
              style={{
                padding: '0.6rem 1rem',
                background: 'rgba(255,68,102,0.1)',
                border: '1px solid rgba(255,68,102,0.2)',
                color: '#ff4466',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⏹ Parar
            </button>
          </div>
        )}

        {/* Manual input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Digite: 05 12 23 34 41 57 (espaços ou vírgulas)"
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.6rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
            style={{
              padding: '0.6rem 1rem',
              background: manualInput.trim()
                ? 'rgba(0,230,118,0.15)'
                : 'rgba(255,255,255,0.03)',
              border: '1px solid',
              borderColor: manualInput.trim()
                ? 'rgba(0,230,118,0.3)'
                : 'rgba(255,255,255,0.1)',
              color: manualInput.trim() ? '#00e676' : 'var(--text-muted)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: manualInput.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            ✓
          </button>
        </div>

        <style>{`
          @keyframes scan-line {
            0%, 100% { top: -2px; }
            50% { top: calc(100% - 2px); }
          }
        `}</style>
      </div>
    </div>
  );
}
