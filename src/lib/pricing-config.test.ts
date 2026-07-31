import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ANNUAL_PRICE,
  DEFAULT_MONTHLY_PRICE,
  normalizeAnnualPrice,
  normalizeMonthlyPrice,
} from './pricing-config';

describe('pricing config', () => {
  it('usa os precos padrao quando a configuracao e invalida', () => {
    expect(normalizeMonthlyPrice(undefined)).toBe(DEFAULT_MONTHLY_PRICE);
    expect(normalizeMonthlyPrice('0')).toBe(DEFAULT_MONTHLY_PRICE);
    expect(normalizeAnnualPrice('invalido')).toBe(DEFAULT_ANNUAL_PRICE);
  });

  it('corrige o preco anual legado', () => {
    expect(normalizeAnnualPrice('11.17')).toBe(DEFAULT_ANNUAL_PRICE);
    expect(normalizeAnnualPrice('11,17')).toBe(DEFAULT_ANNUAL_PRICE);
  });

  it('preserva precos validos configurados pelo administrador', () => {
    expect(normalizeMonthlyPrice('19,90')).toBe(19.9);
    expect(normalizeAnnualPrice('149.90')).toBe(149.9);
  });
});
