import { createClient } from '@libsql/client';

type DbClient = ReturnType<typeof createClient>;
const MISSING_DB_ENV_MESSAGE =
  'TURSO_CONNECTION_URL não está definido nas variáveis de ambiente';

let client: DbClient | null = null;

function getDbClient(): DbClient {
  if (client) {
    return client;
  }

  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(MISSING_DB_ENV_MESSAGE);
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export const db = {
  execute: ((...args: unknown[]) =>
    (getDbClient().execute as (...params: unknown[]) => unknown)(
      ...args
    )) as DbClient['execute'],
  close: ((...args: unknown[]) =>
    (getDbClient().close as (...params: unknown[]) => unknown)(
      ...args
    )) as DbClient['close'],
};

export function isMissingDbEnvError(error: unknown): boolean {
  return error instanceof Error && error.message === MISSING_DB_ENV_MESSAGE;
}

export async function ensureConfigTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed default values if not exists
    await db.execute(
      "INSERT OR IGNORE INTO app_config (key, value) VALUES ('price_monthly', '14.90')"
    );
    await db.execute(
      "INSERT OR IGNORE INTO app_config (key, value) VALUES ('price_annual', '129.90')"
    );
  } catch (e) {
    if (!isMissingDbEnvError(e)) {
      console.error('Failed to create/seed app_config:', e);
    }
  }
}
