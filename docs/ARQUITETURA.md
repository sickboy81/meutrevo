# Arquitetura

## Visao geral

O projeto usa Next.js App Router com separacao clara entre:

- paginas publicas de aquisicao e SEO em `src/app`
- painel autenticado em `src/app/app/page.tsx`
- APIs internas em `src/app/api`
- utilitarios de dominio em `src/lib`

## Camadas

### UI e rotas

- `src/app/page.tsx`: landing principal.
- `src/app/app/page.tsx`: painel principal autenticado.
- `src/app/components/*`: componentes compartilhados da UI.
- `src/app/<loteria>/page.tsx`: paginas por produto/loteria.

### Backend HTTP

- `src/app/api/auth/*`: login, cadastro, sessao, recuperacao e atualizacao.
- `src/app/api/payments/*`: checkout, status e webhook.
- `src/app/api/admin/*`: usuarios, papeis e seed de cache.
- `src/app/api/games`, `simulations`, `bets`: persistencia por usuario.
- `src/app/api/loteria/[type]`: proxy/cache de resultados oficiais.

### Dominio e infraestrutura

- `src/lib/db.ts`: conexao LibSQL/Turso.
- `src/lib/auth-utils.ts` e `src/lib/api-auth.ts`: sessao e autorizacao.
- `src/lib/validate.ts`, `sanitize.ts`: validacao e higienizacao.
- `src/lib/rate-limit.ts`: limitacao basica para endpoints sensiveis.
- `src/lib/lottery-math.ts`: regras matematicas e analises lotericas.

## Dados persistidos

As tabelas descritas e inicializadas pelo projeto incluem:

- `users`
- `saved_games`
- `saved_simulations`
- `bets`
- `app_config`
- `lottery_cache`

## Fluxos importantes

### Auth

1. usuario autentica em `/api/auth/login` ou `/api/auth/register`
2. backend define cookie HTTP-only
3. frontend consulta `/api/auth/me` para reidratar sessao

### Resultados oficiais

1. frontend chama `/api/loteria/[type]`
2. backend usa cache local quando possivel
3. resultado recente alimenta landing e painel

### Assinatura Pro

1. frontend chama `/api/payments/checkout`
2. backend cria cobranca Pix
3. status e webhook promovem usuario para `pro`

## Pontos de atencao

- O painel em `/app` concentra muito comportamento em um unico arquivo. O proximo passo natural e quebrar por feature.
- Existem textos e metadados com naming de marca misto. Isso deve ser tratado como tarefa de padronizacao.
