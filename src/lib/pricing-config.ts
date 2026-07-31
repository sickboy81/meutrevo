export const DEFAULT_MONTHLY_PRICE = 14.9;
export const DEFAULT_ANNUAL_PRICE = 129.9;

function parsePrice(value: unknown): number | null {
  const normalized =
    typeof value === 'string' ? value.trim().replace(',', '.') : value;
  const parsed =
    typeof normalized === 'number' ? normalized : Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeMonthlyPrice(value: unknown): number {
  return parsePrice(value) ?? DEFAULT_MONTHLY_PRICE;
}

export function normalizeAnnualPrice(value: unknown): number {
  const parsed = parsePrice(value);

  // Corrige a configuracao anual legada que foi persistida como R$ 11,17.
  if (parsed === null || Math.abs(parsed - 11.17) < 0.005) {
    return DEFAULT_ANNUAL_PRICE;
  }

  return parsed;
}
