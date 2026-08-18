import { describe, expect, it } from 'vitest';
import {
  blockDangerousSchemes,
  generateShareCode,
  getShareUrl,
  validateShareUrl,
} from '../qr-share';

// ---------------------------------------------------------------------------
// generateShareCode
// ---------------------------------------------------------------------------
describe('generateShareCode', () => {
  it('retorna string de 22 caracteres', () => {
    expect(generateShareCode()).toHaveLength(22);
  });

  it('nao contem hifens', () => {
    expect(generateShareCode()).not.toMatch(/-/);
  });

  it('gera codigos unicos', () => {
    const codes = new Set(
      Array.from({ length: 50 }, () => generateShareCode())
    );
    expect(codes.size).toBe(50);
  });

  it('contem apenas caracteres hexadecimais', () => {
    const code = generateShareCode();
    expect(code).toMatch(/^[0-9a-f]{22}$/);
  });
});

// ---------------------------------------------------------------------------
// blockDangerousSchemes
// ---------------------------------------------------------------------------
describe('blockDangerousSchemes', () => {
  it('bloqueia javascript:', () => {
    expect(blockDangerousSchemes('javascript:alert(1)')).toBe(true);
  });

  it('bloqueia data:', () => {
    expect(blockDangerousSchemes('data:text/html,<h1>hi</h1>')).toBe(true);
  });

  it('bloqueia file:', () => {
    expect(blockDangerousSchemes('file:///etc/passwd')).toBe(true);
  });

  it('bloqueia ftp:', () => {
    expect(blockDangerousSchemes('ftp://example.com/file')).toBe(true);
  });

  it('permite http:', () => {
    expect(blockDangerousSchemes('http://example.com')).toBe(false);
  });

  it('permite https:', () => {
    expect(blockDangerousSchemes('https://example.com')).toBe(false);
  });

  it('bloqueia URL invalida', () => {
    expect(blockDangerousSchemes('not-a-url')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateShareUrl
// ---------------------------------------------------------------------------
describe('validateShareUrl', () => {
  it('detecta link do Meu Trevo (www)', () => {
    const result = validateShareUrl('https://www.meutrevo.com/bolao/abc');
    expect(result.isMeuTrevo).toBe(true);
    expect(result.safe).toBe(true);
  });

  it('detecta link do Meu Trevo (sem www)', () => {
    const result = validateShareUrl('https://meutrevo.com/bolao/abc');
    expect(result.isMeuTrevo).toBe(true);
  });

  it('detecta subdominio do Meu Trevo', () => {
    const result = validateShareUrl('https://api.meutrevo.com/bolao');
    expect(result.isMeuTrevo).toBe(true);
  });

  it('remove params de tracking', () => {
    const url = 'https://example.com/page?utm_source=fb&ref=home&keep=1';
    const result = validateShareUrl(url);
    expect(result.displayUrl).not.toContain('utm_source');
    expect(result.displayUrl).not.toContain('ref=');
    expect(result.displayUrl).toContain('keep=1');
  });

  it('marca esquema perigoso como unsafe', () => {
    const result = validateShareUrl('javascript:void(0)');
    expect(result.safe).toBe(false);
  });

  it('nao detecta Meu Trevo em site diferente', () => {
    const result = validateShareUrl('https://example.com');
    expect(result.isMeuTrevo).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getShareUrl
// ---------------------------------------------------------------------------
describe('getShareUrl', () => {
  it('constrói URL com o código informado', () => {
    const url = getShareUrl('abc123def456');
    expect(url).toContain('/bolao/abc123def456');
  });

  it('usa NEXT_PUBLIC_APP_URL quando definido', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom.app';
    expect(getShareUrl('x')).toBe('https://custom.app/bolao/x');
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('usa fallback meutrevo.com por padrao', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getShareUrl('test')).toBe('https://www.meutrevo.com/bolao/test');
    process.env.NEXT_PUBLIC_APP_URL = original;
  });
});
