# Loteria

Aplicacao Next.js para resultados oficiais das loterias da Caixa, landing comercial, area autenticada com jogos salvos e fluxo de assinatura Pro por Pix.

## Estrutura principal

- `/`: landing publica com resultados em cache, CTA comercial e simulador rapido.
- `/app`: experiencia autenticada principal com resultados, perfil, admin e ferramentas do painel.
- `/megasena`, `/lotofacil`, `/quina`, `/lotomania` e outras: paginas de conteudo e captura organica por loteria.
- `src/app/api/*`: rotas server-side para auth, pagamentos, admin, jogos, simulacoes e resultados.
- `src/lib/*`: banco, auth, validacao, sanitizacao, rate limit e logica matematica.

## Rodando localmente

1. Copie `.env.example` para `.env.local`.
2. Preencha pelo menos:

```env
TURSO_CONNECTION_URL=
TURSO_AUTH_TOKEN=
JWT_SECRET=
PIXGO_API_KEY=
PIXGO_WEBHOOK_SECRET=
```

3. Instale e inicialize:

```bash
npm install
npm run db:init
npm run dev
```

App local: `http://localhost:3000`

## Qualidade

Comandos principais:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

No estado atual do projeto, esses quatro comandos passam.

## Documentacao

- [API](docs/API.md)
- [Operacao](docs/OPERACAO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Qualidade](docs/QUALIDADE.md)

## Observacoes

- A marca principal do produto permanece `Meu Trevo` nos pontos principais de experiencia, metadados e comunicacoes.
- O checkout Pix suporta modo placeholder para desenvolvimento local, conforme descrito em `docs/OPERACAO.md`.
