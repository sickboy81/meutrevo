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
- `src/__tests__/api/games.test.ts`
- `src/__tests__/components/LgpdBanner.test.tsx`
- `src/math.test.ts`

## E2E

Existe Playwright configurado em `e2e/`, com:

- `e2e/smoke.spec.ts`
- `e2e/auth.spec.ts`

Rode manualmente quando alterar fluxos criticos:

```bash
npm run test:e2e
```

## Problemas corrigidos nesta revisao

- dependencias de Testing Library ausentes quebravam `typecheck` e `test`
- warnings antigos de `page.tsx` removidos
- arquivos residuais de recuperacao foram removidos do codigo-fonte

## Riscos ainda existentes

- o painel principal segue concentrado em um arquivo grande, o que aumenta risco de regressao local
- a identidade visual e textual ainda mistura nomes de produto em partes diferentes da base
