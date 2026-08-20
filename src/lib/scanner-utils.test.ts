import { describe, expect, it } from 'vitest';
import {
  applyDetectedNumbersToFiltersMap,
  extractLotteryNumbers,
  prepareOcrText,
} from './scanner-utils';

describe('scanner utilities', () => {
  it('extracts unique lottery numbers from OCR text', () => {
    expect(extractLotteryNumbers('Jogo: 01 01 7 12 23 99 101')).toEqual([
      '01',
      '07',
      '12',
      '23',
      '99',
    ]);
  });

  it('normalizes OCR punctuation before extracting numbers', () => {
    expect(prepareOcrText('01|05. 12, 23')).toBe('01 05 12 23');
  });

  it('applies detected numbers to generator filters, clearing old fixed values', () => {
    const current = {
      1: 'fixed',
      2: 'excluded',
      3: 'fixed',
    } as const;

    const next = applyDetectedNumbersToFiltersMap(
      ['02', '05', '99'],
      current as unknown as Record<number, 'fixed' | 'excluded' | 'none'>,
      1,
      60
    );

    expect(next[1]).toBeUndefined();
    expect(next[3]).toBeUndefined();
    expect(next[2]).toBe('fixed');
    expect(next[5]).toBe('fixed');
    expect(next[99]).toBeUndefined();
  });
});
