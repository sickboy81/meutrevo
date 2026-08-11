import postgres, { type Sql } from 'postgres';

type Query = string | { sql: string; args?: unknown[] };
type Result = {
  rows: Record<string, unknown>[];
  columns?: string[];
  rowsAffected?: number;
};

const MISSING_DB_ENV_MESSAGE =
  'Nenhuma conexão de banco foi definida nas variáveis de ambiente';
const DATABASE_QUERY_TIMEOUT_MS = 8_000;

let pg: Sql<Record<string, unknown>> | null = null;

type CancellableQuery<T> = PromiseLike<T> & { cancel: () => void };

export class DatabaseQueryTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`A consulta ao banco excedeu o limite de ${timeoutMs}ms`);
    this.name = 'DatabaseQueryTimeoutError';
  }
}

export function executeWithDatabaseTimeout<T>(
  query: CancellableQuery<T>,
  timeoutMs = DATABASE_QUERY_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      query.cancel();
      reject(new DatabaseQueryTimeoutError(timeoutMs));
    }, timeoutMs);

    query.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function getSupabaseClient(): Sql<Record<string, unknown>> {
  if (pg) return pg;

  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error(MISSING_DB_ENV_MESSAGE);

  pg = postgres(url, {
    // A small reusable pool avoids the high connection latency of the
    // transaction pooler while keeping Vercel instance usage bounded.
    max: 2,
    idle_timeout: 20,
    connect_timeout: 5,
    prepare: false,
  }) as Sql<Record<string, unknown>>;
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
  const result = await executeWithDatabaseTimeout(
    getSupabaseClient().unsafe(sql, args)
  );
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

    const client = getSupabaseClient();
    const results: Result[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        client.begin(async (transaction) => {
          for (const query of queries) {
            const { sql, args } = normalizeQuery(query);
            const rows = await transaction.unsafe(sql, args);
            results.push({
              rows: rows as unknown as Record<string, unknown>[],
              rowsAffected: rows.count,
            });
          }
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new DatabaseQueryTimeoutError(DATABASE_QUERY_TIMEOUT_MS));
          }, DATABASE_QUERY_TIMEOUT_MS);
        }),
      ]);
      return results;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },

  async close() {
    if (pg) {
      await pg.end({ timeout: 1 }).catch(() => {});
      pg = null;
    }
  },
};

export function isMissingDbEnvError(error: unknown): boolean {
  return error instanceof Error && error.message === MISSING_DB_ENV_MESSAGE;
}
