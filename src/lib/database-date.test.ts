import { describe, expect, it } from 'vitest';
import { normalizeDatabaseDate } from './database-date';

describe('normalizeDatabaseDate', () => {
  it('converts Caixa dates to PostgreSQL format', () => {
    expect(normalizeDatabaseDate('09/08/2026')).toBe('2026-08-09');
  });

  it('accepts valid ISO dates and rejects missing or invalid values', () => {
    expect(normalizeDatabaseDate('2026-08-09T00:00:00.000Z')).toBe(
      '2026-08-09'
    );
    expect(normalizeDatabaseDate('')).toBeNull();
    expect(normalizeDatabaseDate('31/02/2026')).toBeNull();
  });
});
