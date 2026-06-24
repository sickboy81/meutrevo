# API do Meu Trevo

Todas as rotas ficam em `src/app/api` e retornam JSON.

## Autenticação

- `POST /api/auth/register`: cria usuário e define cookie `token` HTTP-only.
- `POST /api/auth/login`: autentica usuário e define cookie `token` HTTP-only.
- `POST /api/auth/logout`: remove o cookie de sessão.
- `GET /api/auth/me`: retorna o usuário autenticado e consulta o papel atual no banco.

Papéis suportados:

- `free`: usuário padrão.
- `pro`: usuário com recursos premium.
- `admin`: acesso administrativo e também acesso aos recursos Pro.

## Loterias

- `GET /api/loteria/{type}`: busca último concurso e usa cache local.
- `GET /api/loteria/{type}?limit=30`: retorna último concurso e histórico limitado.
- `GET /api/loteria/{type}?concurso=1234`: busca concurso específico.

Tipos principais usados pela UI: `megasena`, `lotofacil`, `quina`, `lotomania`, `duplasena`, `diadesorte`, `timemania`, `maismilionaria`.

## Dados do Usuário

- `GET /api/games`: lista jogos salvos do usuário autenticado.
- `POST /api/games`: salva jogo com `{ "lottery": "...", "numbers": "..." }`.
- `DELETE /api/games?id={gameId}`: remove jogo do próprio usuário.
- `GET /api/simulations`: lista simulações salvas.
- `POST /api/simulations`: salva simulação com `lottery`, `numbers`, `max_hits` e `hits_count`.
- `DELETE /api/simulations?id={simId}`: remove simulação do próprio usuário.

## Recursos Pro

- `GET /api/bets`: lista registros financeiros do usuário Pro ou admin.
- `POST /api/bets`: salva aposta com `lottery`, `numbers`, `contest_num`, `cost` e `prize_won`.
- `DELETE /api/bets?id={betId}`: remove aposta do próprio usuário.

## Pagamentos

- `POST /api/payments/checkout`: cria checkout do provedor informado (`pixgo` ou `stripe`) usando preços de `app_config`.
- `GET /api/payments/status?id={paymentId}`: consulta pagamento.
- `GET /api/payments/status?id={paymentId}&confirm=true`: confirma pagamento simulado somente quando `PIXGO_API_KEY` estiver ausente ou iniciar com `pk_placeholder`.
- `POST /api/payments/webhook`: recebe evento `payment.completed` e promove usuário para Pro por 30 dias.
- `POST /api/payments/stripe/webhook`: recebe eventos do Stripe Checkout/Billing e sincroniza acesso Pro com a assinatura.

Em produção, configure `PIXGO_WEBHOOK_SECRET` real para validar assinatura HMAC-SHA256.
Para Stripe, configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY_ID` e `STRIPE_PRICE_YEARLY_ID`.

Atualização PixGo verificada na documentação de 12/03/2026:

- A criação de pagamento usa `receiver_*` em vez de `customer_*`.
- `receiver_cpf` passa a ser obrigatório em `25/06/2026`.
- O documento informado deve pertencer ao pagador real do Pix; terceiros podem ter o pagamento rejeitado pelo provedor.
- O checkout agora envia `webhook_url` por pagamento para manter a confirmação assíncrona alinhada com a regra atual da PixGo.

## Rate Limit

As rotas em `/api/*` passam por rate limit em `src/proxy.ts` e, nas rotas críticas, por controles adicionais no próprio handler.

Camadas atuais:

- camada global por rota no `proxy`
- camadas contextuais por `IP + e-mail`, `IP + usuário autenticado` ou fingerprint do webhook nas rotas mais sensíveis
- store atual em memória, já abstraído em `src/lib/rate-limit.ts` para futura troca por Redis ou outro backend compartilhado sem reescrever as rotas

- `GET /api/health`: sem rate limit.
- Autenticação crítica (`/api/auth/login`, `/api/auth/register`, `/api/auth/recover`, `/api/auth/reset`): `5` requisições por `60s`.
- Outras rotas de autenticação (`/api/auth/*`): `12` requisições por `5 min`.
- Checkout (`/api/payments/checkout`): `10` requisições por `60s`.
- Status de pagamento (`/api/payments/status`): `30` requisições por `60s`.
- Admin e webhook (`/api/admin/*`, `/api/payments/webhook`, `/api/payments/stripe/webhook`, `POST /api/config`): `20` requisições por `60s`.
- Dados autenticados (`/api/games`, `/api/simulations`, `/api/bets`, `GET /api/config`, `/api/auth/me`): `60` requisições por `60s`.
- Consulta pública de loterias (`/api/loteria/*`): `90` requisições por `60s`.
- Demais rotas da API: `40` requisições por `60s`.

Controles extras hoje:

- `POST /api/auth/login`: trava adicional por `IP + e-mail` e por janela maior do IP para reduzir password spraying
- `POST /api/auth/register`: trava adicional por `IP + e-mail` e por janela maior do IP para reduzir flood de cadastro
- `POST /api/auth/recover`: trava adicional por `IP + e-mail` para reduzir email bombing
- `POST /api/config` e `POST /api/admin/users/role`: limite por usuário admin autenticado
- `POST /api/payments/webhook`: fingerprint anti-replay por assinatura + timestamp + corpo
- `POST /api/payments/stripe/webhook`: fingerprint anti-replay por `event.id` validado com a assinatura oficial do Stripe

Quando o limite e excedido, a API responde `429` com os headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`.

Limitação importante do estado atual:

- como o store ainda e local/em memória, a proteção funciona bem contra abuso direto e bots simples em uma instância, mas nao coordena contadores entre múltiplas instâncias
- a base ja esta preparada para migrar para Redis ou outro store compartilhado quando voce decidir adicionar a infraestrutura

## Admin

- `GET /api/admin/users`: estatísticas e lista de usuários sem senha.
- `POST /api/admin/users/role`: altera papel com `{ "userId": "...", "newRole": "free|pro|admin" }`.
- `GET /api/config`: lista configurações públicas como preços.
- `POST /api/config`: altera configuração. Requer admin.
