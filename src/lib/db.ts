import { createClient } from '@libsql/client';

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    'TURSO_CONNECTION_URL não está definido nas variáveis de ambiente'
  );
}

export const db = createClient({
  url: url,
  authToken: authToken,
});

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
    console.error('Failed to create/seed app_config:', e);
  }
}
