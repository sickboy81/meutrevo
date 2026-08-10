/**
 * Converts lottery dates to the ISO format expected by PostgreSQL date columns.
 * Caixa and mirror sources normally use DD/MM/YYYY, but some responses omit it.
 */
export function normalizeDatabaseDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    const date = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day))
    );
    if (
      date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day)
    ) {
      return null;
    }
    return `${year}-${month}-${day}`;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return null;
  const [, year, month, day] = iso;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}
