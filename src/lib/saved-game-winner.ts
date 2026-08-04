export type SavedGameWinnerStatus = 'winner' | 'not-winner' | 'manual-review';

/**
 * Some Caixa games require data that is not stored with a saved game, such as
 * Trevos, Mês da Sorte, Time do Coração, column positions, or ticket order.
 * Never label those games as non-winning based only on matching numbers.
 */
export function getSavedGameWinnerStatus(
  lottery: string,
  hits: number
): SavedGameWinnerStatus {
  switch (lottery) {
    case 'megasena':
      return hits >= 4 ? 'winner' : 'not-winner';
    case 'lotofacil':
      return hits >= 11 ? 'winner' : 'not-winner';
    case 'quina':
      return hits >= 2 ? 'winner' : 'not-winner';
    case 'lotomania':
      return hits === 0 || hits >= 16 ? 'winner' : 'not-winner';
    case 'duplasena':
      return hits >= 3 ? 'winner' : 'not-winner';
    case 'diadesorte':
      // A Mês da Sorte-only prize requires a choice not stored with the game.
      return hits >= 4 ? 'winner' : 'manual-review';
    case 'timemania':
      // Time do Coração is not persisted with saved games.
      return hits >= 3 ? 'winner' : 'manual-review';
    case 'loteca':
      return hits >= 13 ? 'winner' : 'not-winner';
    case 'maismilionaria':
    case 'supersete':
    case 'loteriafederal':
      return 'manual-review';
    default:
      return 'manual-review';
  }
}
