import { describe, expect, it } from 'vitest';
import {
  normalizeColorScheme,
  resolveColorScheme,
  type ColorSchemePreference,
} from './color-scheme';

describe('color scheme', () => {
  it('uses light as the default for new visitors', () => {
    expect(normalizeColorScheme(null)).toBe('light');
    expect(normalizeColorScheme('unknown')).toBe('light');
  });

  it.each<ColorSchemePreference>(['light', 'dark', 'system'])(
    'keeps the persisted %s preference',
    (preference) => {
      expect(normalizeColorScheme(preference)).toBe(preference);
    }
  );

  it('resolves system using the current operating system preference', () => {
    expect(resolveColorScheme('system', true)).toBe('dark');
    expect(resolveColorScheme('system', false)).toBe('light');
    expect(resolveColorScheme('dark', false)).toBe('dark');
    expect(resolveColorScheme('light', true)).toBe('light');
  });
});
