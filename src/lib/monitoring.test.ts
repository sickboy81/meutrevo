import { describe, expect, it } from 'vitest';
import { getMonitoringContext } from './monitoring';

describe('monitoring context', () => {
  it('keeps operational context without sensitive values', () => {
    const context = getMonitoringContext({
      provider: 'pixgo',
      operation: 'checkout',
      lottery: 'mega-sena',
      apiKey: 'should-not-be-sent',
      password: 'should-not-be-sent',
    });

    expect(context).toEqual({
      provider: 'pixgo',
      operation: 'checkout',
      lottery: 'mega-sena',
    });
  });
});
