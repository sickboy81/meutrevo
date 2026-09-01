import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorSchemeProvider } from '@/app/components/ColorSchemeProvider';
import ColorSchemeControl from '@/app/components/ColorSchemeControl';

describe('ColorSchemeControl', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.colorScheme = 'light';
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as unknown as typeof window.matchMedia,
    });
  });

  it('starts in light mode and persists the selected preference', () => {
    render(
      <ColorSchemeProvider>
        <ColorSchemeControl />
      </ColorSchemeProvider>
    );

    expect(
      screen.getByRole('button', { name: /modo claro ativo/i })
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /usar modo escuro/i }));

    expect(document.documentElement.dataset.colorScheme).toBe('dark');
    expect(localStorage.getItem('meutrevo-color-scheme')).toBe('dark');
  });

  it('cycles through every preference in compact mode', () => {
    render(
      <ColorSchemeProvider>
        <ColorSchemeControl compact />
      </ColorSchemeProvider>
    );

    const toggle = screen.getByRole('button', { name: /aparência: claro/i });
    fireEvent.click(toggle);
    expect(localStorage.getItem('meutrevo-color-scheme')).toBe('dark');
    fireEvent.click(toggle);
    expect(localStorage.getItem('meutrevo-color-scheme')).toBe('system');
  });
});
