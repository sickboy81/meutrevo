import { describe, expect, it } from 'vitest';
import {
  extractCandidateNumbers,
  mergeManualCorrections,
  normalizeDetectedNumbers,
  validateDetectedNumbers,
} from '../ocr';

// ---------------------------------------------------------------------------
// extractCandidateNumbers
// ---------------------------------------------------------------------------
describe('extractCandidateNumbers', () => {
  it('extrai numeros de 1 a 3 digitos de texto bruto', () => {
    expect(extractCandidateNumbers('05 12 34 abc 7')).toEqual([5, 12, 34, 7]);
  });

  it('retorna array vazio quando nao ha numeros', () => {
    expect(extractCandidateNumbers('sem numeros aqui')).toEqual([]);
  });

  it('ignora texto nao numerico entre espacos', () => {
    expect(extractCandidateNumbers('foo bar baz')).toEqual([]);
  });

  it('extrai numero unico', () => {
    expect(extractCandidateNumbers('42')).toEqual([42]);
  });
});

// ---------------------------------------------------------------------------
// normalizeDetectedNumbers
// ---------------------------------------------------------------------------
describe('normalizeDetectedNumbers', () => {
  it('remove duplicatas e ordena', () => {
    expect(normalizeDetectedNumbers([5, 3, 5, 1, 3])).toEqual([1, 3, 5]);
  });

  it('filtra numeros fora da faixa 0-99', () => {
    expect(normalizeDetectedNumbers([1, 100, 99, -1, 200])).toEqual([1, 99]);
  });

  it('retorna array vazio para entrada vazia', () => {
    expect(normalizeDetectedNumbers([])).toEqual([]);
  });

  it('aceita 0 como valido', () => {
    expect(normalizeDetectedNumbers([0, 5, 0])).toEqual([0, 5]);
  });

  it('mantem numeros ja ordenados', () => {
    expect(normalizeDetectedNumbers([10, 20, 30])).toEqual([10, 20, 30]);
  });
});

// ---------------------------------------------------------------------------
// validateDetectedNumbers
// ---------------------------------------------------------------------------
describe('validateDetectedNumbers', () => {
  it('megasena: valida 6 numeros entre 1-60', () => {
    const result = validateDetectedNumbers([1, 10, 20, 30, 40, 50], 'megasena');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('megasena: rejeita quantidade insuficiente', () => {
    const result = validateDetectedNumbers([1, 2, 3], 'megasena');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Quantidade insuficiente');
  });

  it('megasena: rejeita quantidade excedida', () => {
    const result = validateDetectedNumbers([1, 2, 3, 4, 5, 6, 7], 'megasena');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Quantidade excedida');
  });

  it('megasena: rejeita numero fora da faixa', () => {
    const result = validateDetectedNumbers([1, 10, 20, 30, 40, 61], 'megasena');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('fora da faixa'))).toBe(true);
  });

  it('lotofacil: valida 15 numeros entre 1-25', () => {
    const nums = Array.from({ length: 15 }, (_, i) => i + 1);
    const result = validateDetectedNumbers(nums, 'lotofacil');
    expect(result.valid).toBe(true);
  });

  it('lotofacil: rejeita numero acima de 25', () => {
    const nums = [...Array.from({ length: 14 }, (_, i) => i + 1), 26];
    const result = validateDetectedNumbers(nums, 'lotofacil');
    expect(result.valid).toBe(false);
  });

  it('quina: valida 5 numeros entre 1-80', () => {
    const result = validateDetectedNumbers([5, 15, 25, 35, 45], 'quina');
    expect(result.valid).toBe(true);
  });

  it('quina: rejeita quantidade errada', () => {
    const result = validateDetectedNumbers([5, 15, 25], 'quina');
    expect(result.valid).toBe(false);
  });

  it('lotomania: valida 50 numeros entre 0-99', () => {
    const nums = Array.from({ length: 50 }, (_, i) => i);
    const result = validateDetectedNumbers(nums, 'lotomania');
    expect(result.valid).toBe(true);
  });

  it('lotomania: rejeita numero fora da faixa (100)', () => {
    const nums = [...Array.from({ length: 49 }, (_, i) => i), 100];
    const result = validateDetectedNumbers(nums, 'lotomania');
    expect(result.valid).toBe(false);
  });

  it('retorna erro para loteria desconhecida', () => {
    const result = validateDetectedNumbers([1, 2, 3], 'invalida');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('nao encontrada');
  });
});

// ---------------------------------------------------------------------------
// mergeManualCorrections
// ---------------------------------------------------------------------------
describe('mergeManualCorrections', () => {
  it('adiciona numeros novos', () => {
    expect(mergeManualCorrections([1, 2], [3, 4], [])).toEqual([1, 2, 3, 4]);
  });

  it('remove numeros existentes', () => {
    expect(mergeManualCorrections([1, 2, 3], [], [2])).toEqual([1, 3]);
  });

  it('adiciona e remove simultaneamente', () => {
    expect(mergeManualCorrections([1, 2, 3], [4, 5], [2])).toEqual([
      1, 3, 4, 5,
    ]);
  });

  it('retorna array vazio quando tudo e removido', () => {
    expect(mergeManualCorrections([1, 2], [], [1, 2])).toEqual([]);
  });

  it('normaliza duplicatas apos merge', () => {
    expect(mergeManualCorrections([1, 2], [2, 3], [])).toEqual([1, 2, 3]);
  });

  it('trata arrays vazios', () => {
    expect(mergeManualCorrections([], [], [])).toEqual([]);
  });
});
