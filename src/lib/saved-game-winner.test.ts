import { describe, expect, it } from 'vitest';
import { getSavedGameWinnerStatus } from './saved-game-winner';

describe('getSavedGameWinnerStatus', () => {
  it('identifica as faixas conferíveis por dezenas', () => {
    expect(getSavedGameWinnerStatus('megasena', 4)).toBe('winner');
    expect(getSavedGameWinnerStatus('lotofacil', 11)).toBe('winner');
    expect(getSavedGameWinnerStatus('quina', 2)).toBe('winner');
    expect(getSavedGameWinnerStatus('duplasena', 3)).toBe('winner');
    expect(getSavedGameWinnerStatus('loteca', 13)).toBe('winner');
  });

  it('trata os extremos premiados da Lotomania', () => {
    expect(getSavedGameWinnerStatus('lotomania', 0)).toBe('winner');
    expect(getSavedGameWinnerStatus('lotomania', 16)).toBe('winner');
    expect(getSavedGameWinnerStatus('lotomania', 15)).toBe('not-winner');
  });

  it('pede conferência manual quando faltam dados da aposta', () => {
    expect(getSavedGameWinnerStatus('timemania', 1)).toBe('manual-review');
    expect(getSavedGameWinnerStatus('diadesorte', 2)).toBe('manual-review');
    expect(getSavedGameWinnerStatus('maismilionaria', 6)).toBe('manual-review');
    expect(getSavedGameWinnerStatus('supersete', 7)).toBe('manual-review');
    expect(getSavedGameWinnerStatus('loteriafederal', 5)).toBe('manual-review');
  });
});
