import { describe, expect, it } from 'vitest';
import { extractLotteryNumbers, prepareOcrText } from './scanner-utils';

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
});
