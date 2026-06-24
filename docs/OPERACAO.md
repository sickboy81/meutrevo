# Operação Local e Produção

## Setup local

1. Copie `.env.example` para `.env.local`.
2. Configure `TURSO_CONNECTION_URL` e `TURSO_AUTH_TOKEN`.
3. Gere um `JWT_SECRET` com pelo menos 32 caracteres.
4. Rode:

```bash
npm install
npm run db:init
npm run dev
```

O app abre em `http://localhost:3000`.

## Banco de dados

O script `npm run db:init` valida ou cria:

- `users`
- `saved_games`
- `saved_simulations`
- `bets`
- `app_config`
- `lottery_cache`

Também adiciona as colunas `role` e `premium_until` em bases antigas quando elas ainda não existem.

## Pagamentos

Use placeholders apenas em desenvolvimento:

- `PIXGO_API_KEY=pk_placeholder_local`
- `PIXGO_WEBHOOK_SECRET=whsec_placeholder_local`

Com placeholder, o checkout gera cobranças simuladas e a rota de status permite confirmação manual. Com uma chave PixGo real, pagamentos simulados são recusados e o webhook precisa de assinatura válida.

## Segurança

- Nunca publique `.env.local`.
- Em produção, `JWT_SECRET` precisa ter pelo menos 32 caracteres.
- O rate limit atual usa store em memória. A aplicação já está preparada para trocar esse backend por Redis ou outro store compartilhado quando houver infraestrutura disponível.
- Para produção exposta, mantenha também proteção de borda no provedor ou reverse proxy sempre que possível.
- Usuários `admin` devem ser criados manualmente no banco ou promovidos por outro admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@exemplo.com';
```

## Verificação

Antes de publicar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run lint` valida regras de codigo. `npm run typecheck` cobre o compilador TS. `npm run test` executa Vitest. `npm run build` valida a integracao final do App Router.
