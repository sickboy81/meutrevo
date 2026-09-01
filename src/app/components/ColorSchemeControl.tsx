'use client';

import { useColorScheme } from './ColorSchemeProvider';
import type { ColorSchemePreference } from '@/lib/color-scheme';

const OPTIONS: Array<{ value: ColorSchemePreference; label: string }> = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Automático' },
];

export default function ColorSchemeControl({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { preference, setPreference } = useColorScheme();

  if (compact) {
    const currentIndex = OPTIONS.findIndex(
      (option) => option.value === preference
    );
    const current = OPTIONS[currentIndex];
    const next = OPTIONS[(currentIndex + 1) % OPTIONS.length];
    return (
      <button
        type="button"
        className="color-scheme-compact"
        aria-label={`Aparência: ${current.label}. Alterar para ${next.label}.`}
        onClick={() => setPreference(next.value)}
      >
        <span className="color-scheme-compact-prefix">Aparência: </span>
        {current.label}
      </button>
    );
  }

  return (
    <div
      className="color-scheme-control"
      role="group"
      aria-label="Aparência do site"
    >
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={active ? 'is-active' : undefined}
            aria-pressed={active}
            aria-label={
              active
                ? `Modo ${option.label.toLowerCase()} ativo`
                : `Usar modo ${option.label.toLowerCase()}`
            }
            onClick={() => setPreference(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
