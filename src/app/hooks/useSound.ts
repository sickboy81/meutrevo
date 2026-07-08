'use client';

import { useCallback } from 'react';

type SoundType = 'click' | 'success' | 'delete';

type AudioContextConstructor = typeof AudioContext;

function getAudioContextClass(): AudioContextConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { webkitAudioContext?: AudioContextConstructor };
  return w.AudioContext || w.webkitAudioContext;
}

/**
 * Singleton AudioContext — reuses the same instance across all calls
 * instead of creating a new one per sound (which leaks memory).
 */
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  const Ctor = getAudioContextClass();
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

export function useSound(enabled: boolean) {
  const play = useCallback((type: SoundType) => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      if (!ctx) return;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        const playNote = (freq: number, start: number, dur: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, ctx.currentTime + start);
          o.frequency.exponentialRampToValueAtTime(
            freq * 1.5,
            ctx.currentTime + start + dur
          );
          g.gain.setValueAtTime(0.06, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + start + dur
          );
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + dur);
        };
        playNote(523.25, 0, 0.15);
        playNote(783.99, 0.1, 0.25);
      } else if (type === 'delete') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  }, []);

  return play;
}
