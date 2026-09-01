export type ColorSchemePreference = 'light' | 'dark' | 'system';
export type ResolvedColorScheme = Exclude<ColorSchemePreference, 'system'>;

export const COLOR_SCHEME_STORAGE_KEY = 'meutrevo-color-scheme';

export function normalizeColorScheme(
  value: string | null | undefined
): ColorSchemePreference {
  return value === 'dark' || value === 'system' || value === 'light'
    ? value
    : 'light';
}

export function resolveColorScheme(
  preference: ColorSchemePreference,
  prefersDark: boolean
): ResolvedColorScheme {
  return preference === 'system'
    ? prefersDark
      ? 'dark'
      : 'light'
    : preference;
}
