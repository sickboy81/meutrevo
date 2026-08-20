export function prepareOcrText(text: string): string {
  return text
    .replace(/[|;]/g, ' ')
    .replace(/[^\d\s,.-]/g, ' ')
    .replace(/[,.\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractLotteryNumbers(text: string): string[] {
  const matches = prepareOcrText(text).match(/\d{1,3}/g) ?? [];
  const numbers = new Set<string>();

  for (const value of matches) {
    const number = Number.parseInt(value, 10);
    if (number >= 1 && number <= 100) {
      numbers.add(String(number).padStart(2, '0'));
    }
  }

  return [...numbers].slice(0, 15);
}

export function applyDetectedNumbersToFiltersMap(
  detected: string[],
  currentFilters: Record<number, 'fixed' | 'excluded' | 'none'>,
  minNum: number,
  maxNum: number
): Record<number, 'fixed' | 'excluded' | 'none'> {
  const next: Record<number, 'fixed' | 'excluded' | 'none'> = {
    ...currentFilters,
  };

  Object.keys(next).forEach((k) => {
    const key = Number(k);
    if (next[key] === 'fixed') {
      delete next[key];
    }
  });

  detected.forEach((n) => {
    const num = Number.parseInt(n, 10);
    if (!Number.isNaN(num) && num >= minNum && num <= maxNum) {
      next[num] = 'fixed';
    }
  });

  return next;
}
