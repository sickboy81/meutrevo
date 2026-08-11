import { describe, expect, it, vi } from 'vitest';
import { DatabaseQueryTimeoutError, executeWithDatabaseTimeout } from './db';

describe('executeWithDatabaseTimeout', () => {
  it('cancels a pending database query instead of waiting indefinitely', async () => {
    const cancel = vi.fn();
    const query = Object.assign(new Promise<never>(() => {}), { cancel });

    await expect(executeWithDatabaseTimeout(query, 10)).rejects.toBeInstanceOf(
      DatabaseQueryTimeoutError
    );
    expect(cancel).toHaveBeenCalledOnce();
  });
});
