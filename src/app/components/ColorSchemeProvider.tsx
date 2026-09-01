'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  COLOR_SCHEME_STORAGE_KEY,
  normalizeColorScheme,
  resolveColorScheme,
  type ColorSchemePreference,
} from '@/lib/color-scheme';

interface ColorSchemeContextValue {
  preference: ColorSchemePreference;
  setPreference: (value: ColorSchemePreference) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);
const COLOR_SCHEME_EVENT = 'meutrevo-color-scheme-change';

function getPreferenceSnapshot() {
  return normalizeColorScheme(
    window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
  );
}

function subscribeToPreference(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(COLOR_SCHEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(COLOR_SCHEME_EVENT, onStoreChange);
  };
}

function applyPreference(preference: ColorSchemePreference) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  document.documentElement.dataset.colorScheme = resolveColorScheme(
    preference,
    media.matches
  );
}

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const preference: ColorSchemePreference = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    (): ColorSchemePreference => 'light'
  );

  useEffect(() => {
    applyPreference(preference);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (preference === 'system') applyPreference('system');
    };
    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, [preference]);

  const setPreference = (value: ColorSchemePreference) => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, value);
    applyPreference(value);
    window.dispatchEvent(new Event(COLOR_SCHEME_EVENT));
  };

  return (
    <ColorSchemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider');
  }
  return context;
}
