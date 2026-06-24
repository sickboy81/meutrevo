/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@libsql/client');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error(
    'Erro: TURSO_CONNECTION_URL não está configurada no .env.local'
  );
  process.exit(1);
}

const db = createClient({ url, authToken });

async function init() {
  console.log('Conectando ao Turso DB para criar as tabelas...');

  try {
    // 1. Criar tabela de Usuários
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        cpf_cnpj TEXT,
        role TEXT DEFAULT 'free',
        premium_until DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db
      .execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'free'")
      .catch(() => {});
    await db
      .execute('ALTER TABLE users ADD COLUMN premium_until DATETIME')
      .catch(() => {});
    await db
      .execute('ALTER TABLE users ADD COLUMN cpf_cnpj TEXT')
      .catch(() => {});
    await db
      .execute('ALTER TABLE users ADD COLUMN reset_token TEXT')
      .catch(() => {});
    await db
      .execute('ALTER TABLE users ADD COLUMN show_in_ranking INTEGER DEFAULT 1')
      .catch(() => {});
    await db.execute('ALTER TABLE users ADD COLUMN city TEXT').catch(() => {});
    await db.execute('ALTER TABLE users ADD COLUMN state TEXT').catch(() => {});
    await db
      .execute('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME')
      .catch(() => {});
    console.log('✓ Tabela "users" validada/criada com sucesso.');

    // 2. Criar tabela de Jogos Salvos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_games (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lottery TEXT NOT NULL,
        numbers TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "saved_games" validada/criada com sucesso.');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_simulations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lottery TEXT NOT NULL,
        numbers TEXT NOT NULL,
        max_hits INTEGER NOT NULL,
        hits_count TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "saved_simulations" validada/criada com sucesso.');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lottery TEXT NOT NULL,
        numbers TEXT NOT NULL,
        contest_num INTEGER NOT NULL,
        cost REAL NOT NULL,
        prize_won REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "bets" validada/criada com sucesso.');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    await db.execute(
      "INSERT OR IGNORE INTO app_config (key, value) VALUES ('price_monthly', '14.90')"
    );
    await db.execute(
      "INSERT OR IGNORE INTO app_config (key, value) VALUES ('price_annual', '129.90')"
    );
    console.log('✓ Tabela "app_config" validada/criada com sucesso.');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS lottery_cache (
        lottery TEXT NOT NULL,
        contest_num INTEGER NOT NULL,
        draw_date TEXT NOT NULL,
        data_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (lottery, contest_num)
      );
    `);
    console.log('✓ Tabela "lottery_cache" validada/criada com sucesso.');

    // Bolões (lottery pools)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS boloes (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        lottery TEXT NOT NULL,
        title TEXT NOT NULL,
        games_json TEXT NOT NULL,
        total_cost REAL NOT NULL DEFAULT 0,
        cotas_total INTEGER NOT NULL DEFAULT 1,
        cotas_taken INTEGER NOT NULL DEFAULT 0,
        taxa_pct REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        contest_num INTEGER,
        prize_won REAL DEFAULT 0,
        prize_distributed INTEGER DEFAULT 0,
        share_code TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "boloes" validada/criada com sucesso.');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bolao_participants (
        id TEXT PRIMARY KEY,
        bolao_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        cota_num INTEGER NOT NULL,
        name TEXT NOT NULL,
        paid INTEGER DEFAULT 0,
        amount_due REAL DEFAULT 0,
        amount_received REAL DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bolao_id) REFERENCES boloes(id) ON DELETE CASCADE
      );
    `);
    console.log('✓ Tabela "bolao_participants" validada/criada com sucesso.');

    // Ranking / Leaderboard
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rankings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lottery TEXT NOT NULL,
        contest_num INTEGER NOT NULL,
        numbers_played TEXT NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        prize_won REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "rankings" validada/criada com sucesso.');

    // Push subscriptions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        endpoint TEXT NOT NULL,
        p256dh TEXT,
        auth TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tabela "push_subscriptions" validada/criada com sucesso.');

    console.log('Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar o banco:', err);
  } finally {
    // Fecha a conexão do banco
    db.close();
  }
}

init();
