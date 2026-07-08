import type { LotteryResult } from '../app/types';

/**
 * Extract clean dezenas from a lottery result.
 * Loteca, supersete & loteriafederal keep raw strings (no sort).
 * Other lotteries: parse to int, sort, pad.
 */
export function getCleanDezenas(
  lotResult: LotteryResult,
  activeLottery: string
): string[] {
  const list =
    lotResult.listaDezenas || lotResult.dezenasSorteadasOrdemSorteio || [];
  if (
    activeLottery === 'supersete' ||
    activeLottery === 'loteca' ||
    activeLottery === 'loteriafederal'
  ) {
    return list;
  }
  return [...list]
    .map((x) => parseInt(x, 10))
    .sort((a, b) => a - b)
    .map((x) => String(x).padStart(2, '0'));
}

/**
 * Toggle a number's filter status: none → fixed → excluded → none
 * Respects the max fixed count (drawCount - 1).
 */
export function toggleFilterStatus(
  num: number,
  currentFilters: Record<number, 'fixed' | 'excluded' | 'none'>,
  drawCount: number
): 'fixed' | 'excluded' | 'none' {
  const current = currentFilters[num] || 'none';
  if (current === 'none') {
    const fixedCount = Object.values(currentFilters).filter(
      (v) => v === 'fixed'
    ).length;
    return fixedCount < drawCount - 1 ? 'fixed' : 'excluded';
  }
  if (current === 'fixed') return 'excluded';
  return 'none';
}
