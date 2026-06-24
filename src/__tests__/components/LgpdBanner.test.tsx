import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LgpdBanner', () => {
  it('deve renderizar o banner quando não há consentimento', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const LgpdBanner = (await import('@/app/components/LgpdBanner')).default;
    render(<LgpdBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(
      screen.getByText(/PRIVACIDADE E PROTEÇÃO DE DADOS/i)
    ).toBeInTheDocument();
  });

  it('deve esconder após aceitar', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const LgpdBanner = (await import('@/app/components/LgpdBanner')).default;
    render(<LgpdBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const acceptBtn = screen.getByText('Aceitar Termos');
    fireEvent.click(acceptBtn);
    expect(setItemSpy).toHaveBeenCalledWith(
      'meutrevo-lgpd-consent',
      'accepted'
    );
  });
});
