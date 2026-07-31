# Qualidade

## Checklist rapido

Execute antes de publicar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## O que cada comando cobre

- `lint`: ESLint para App Router, React e TypeScript.
- `typecheck`: validacao estatica com `tsc --noEmit`.
- `test`: Vitest com testes de API e componente.
- `build`: integracao final de compilacao, types e rotas.

## Suite atual

- `src/__tests__/api/auth.test.ts`
- `src/__tests__/api/br-documents.test.ts`
- `src/__tests__/api/games.test.ts`
- `src/__tests__/api/rate-limit.test.ts`
- `src/__tests__/components/LgpdBanner.test.tsx`
- `src/lib/caixa.test.ts`
- `src/math.test.ts`

## E2E

Existe Playwright configurado em `e2e/`, com:

- `e2e/smoke.spec.ts`
- `e2e/api.spec.ts`
- `e2e/auth-full.spec.ts`
- `e2e/extended-flows.spec.ts`
- `e2e/navigation.spec.ts`
- `e2e/payment.spec.ts`

Rode manualmente quando alterar fluxos criticos:

```bash
npm run test:e2e
```

## Cobertura

Para gerar o relatorio de cobertura:

```bash
npm run coverage
```

O relatorio HTML e os arquivos auxiliares ficam em `coverage/` e nao devem ser
versionados.

## Riscos ainda existentes

- o painel principal segue concentrado em um arquivo grande, o que aumenta risco de regressao local
- fluxos criticos de autenticacao, pagamentos e persistencia devem continuar cobertos pela suite E2E
