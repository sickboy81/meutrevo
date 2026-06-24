import { describe, expect, it } from 'vitest';
import { isValidCpfCnpj, normalizeCpfCnpj } from '@/lib/br-documents';

describe('br-documents', () => {
  it('normalizes punctuation from cpf/cnpj', () => {
    expect(normalizeCpfCnpj('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpfCnpj('04.252.011/0001-10')).toBe('04252011000110');
  });

  it('accepts valid cpf and cnpj', () => {
    expect(isValidCpfCnpj('52998224725')).toBe(true);
    expect(isValidCpfCnpj('04252011000110')).toBe(true);
  });

  it('rejects invalid cpf and cnpj', () => {
    expect(isValidCpfCnpj('11111111111')).toBe(false);
    expect(isValidCpfCnpj('12345678000100')).toBe(false);
  });
});
