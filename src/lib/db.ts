import postgres, { type Sql } from 'postgres';

type Query = string | { sql: string; args?: unknown[] };
type Result = {
  rows: Record<string, unknown>[];
  columns?: string[];
  rowsAffected?: number;
};

const MISSING_DB_ENV_MESSAGE =
  'Nenhuma conexão de banco foi definida nas variáveis de ambiente';

let pg: Sql<Record<string, unknown>> | null = null;

function getSupabaseClient() {
  if (pg) return pg;

  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error(MISSING_DB_ENV_MESSAGE);

  pg = postgres(url, {
    // Vercel instances are short-lived; keep one client per instance.
    // The Supabase transaction pooler (port 6543) handles concurrency.
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false,
  });
  return pg;
}

function shouldUseSupabase() {
  return Boolean(process.env.SUPABASE_DATABASE_URL);
}

function requireSupabase() {
  if (!shouldUseSupabase()) throw new Error(MISSING_DB_ENV_MESSAGE);
}

function normalizeQuery(query: Query) {
  const sql = typeof query === 'string' ? query : query.sql;
  const args = typeof query === 'string' ? [] : (query.args ?? []);
  let index = 0;
  let normalized = sql.replace(/\?/g, () => `$${++index}`);

  // SQLite syntax used by the legacy initializer.
  normalized = normalized.replace(
    /INSERT\s+OR\s+IGNORE\s+INTO/gi,
    'INSERT INTO'
  );
  if (
    /^\s*INSERT\s+INTO/i.test(normalized) &&
    !/ON\s+CONFLICT/i.test(normalized)
  ) {
    normalized += ' ON CONFLICT DO NOTHING';
  }

  return { sql: normalized, args };
}

async function executePostgres(
  query: Query,
  positionalArgs?: unknown[]
): Promise<Result> {
  const input =
    typeof query === 'string' && positionalArgs
      ? { sql: query, args: positionalArgs }
      : query;
  const { sql, args } = normalizeQuery(input);
  const result = await getSupabaseClient().unsafe(sql, args);
  return {
    rows: result as unknown as Record<string, unknown>[],
    rowsAffected: result.count,
  };
}

export const db = {
  async execute(query: Query, positionalArgs?: unknown[]): Promise<Result> {
    requireSupabase();
    return executePostgres(query, positionalArgs);
  },

  async batch(queries: Query[], mode?: string): Promise<Result[]> {
    void mode;
    requireSupabase();

    const results: Result[] = [];
    await getSupabaseClient().begin(async (transaction) => {
      for (const query of queries) {
        const { sql, args } = normalizeQuery(query);
        const rows = await transaction.unsafe(sql, args);
        results.push({
          rows: rows as unknown as Record<string, unknown>[],
          rowsAffected: rows.count,
        });
      }
    });
    return results;
  },

  async close() {
    if (pg) {
      await pg.end({ timeout: 5 });
      pg = null;
    }
  },
};

export function isMissingDbEnvError(error: unknown): boolean {
  return error instanceof Error && error.message === MISSING_DB_ENV_MESSAGE;
}
