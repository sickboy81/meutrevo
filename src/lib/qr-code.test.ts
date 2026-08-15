import { describe, expect, it } from 'vitest';
import { createQrDataUrl } from './qr-code';

describe('QR code generation', () => {
  it('creates a real PNG QR code data URL', async () => {
    const dataUrl = await createQrDataUrl('https://meutrevo.com/jogo?g=test');

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(200);
  });
});
