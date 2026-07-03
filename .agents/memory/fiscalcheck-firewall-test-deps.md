---
name: Deps de teste do web podem ser bloqueadas pelo firewall do Replit
description: Por que pnpm install pode 403 no vitest no repl e o que NAO fazer
---

# Sintoma

No repl, `pnpm install` pode falhar com:

```
ERR_PNPM_FETCH_403 Response status code 403 URL:
https://package-firewall.replit.local/.../vitest-2.1.9.tgz
```

Um 403 do `package-firewall.replit.local` significa que a policy do
Replit bloqueou o download. **Nao adianta reinstalar** — retentar so
gera mais 403.

# Decisao para a develop

Na branch `develop` **mantemos** as devDependencies de teste do web
(`vitest`, `@testing-library/jest-dom`, `@testing-library/react`,
`@vitejs/plugin-react`, `jsdom`) porque:

1. O job `web` do CI (`.github/workflows/ci.yml`) roda
   `pnpm --filter @fiscalcheck/web test`. Remover as deps quebra o CI.
2. Ha 13 arquivos de teste em [`apps/web/tests/`](../../apps/web/tests/)
   (T13 cases, T15 communications, status-badge, status-stepper etc.)
   que dependem desse toolchain.

A branch historica `b-replit` removeu essas deps como workaround local;
essa remocao **nao** deve ser portada para `develop`.

# Consequencia no Replit

## Workaround em vigor: `.pnpmfile.cjs`

O arquivo [`.pnpmfile.cjs`](../../.pnpmfile.cjs) na raiz do repo remove
automaticamente as deps problematicas do `@fiscalcheck/web` **apenas**
quando `pnpm install` roda no contexto de dev/preview do Replit:

- Gate: `process.env.REPL_ID` presente E
  `process.env.REPLIT_DEPLOYMENT !== "1"`.
- Fora do Replit (dev local, CI): hook e no-op. O `package.json`
  passa intacto e o `pnpm-lock.yaml` committado bate.
- No deployment do Replit (que roda com `REPLIT_DEPLOYMENT=1`): hook
  tambem e no-op, entao o `--frozen-lockfile` do
  [`.replit`](../../.replit) continua funcionando.

Consequencias no dev preview do Replit:

- Use `pnpm install` **sem** `--frozen-lockfile` — o lockfile
  committado lista as deps que o hook remove, entao
  `--frozen-lockfile` falharia com "extraneous packages in lockfile".
- `pnpm --filter @fiscalcheck/web test` no repl **falha** porque
  vitest nao foi instalado. Isso e esperado; testes rodam no CI.

## Se o hook nao for suficiente

Se um dia o firewall bloquear pacotes adicionais alem dos listados no
`PACKAGES_TO_STRIP` do `.pnpmfile.cjs`, ou se o gate do hook nao pegar
o contexto certo, escalar em ordem:

1. Adicionar o pacote novo ao array `PACKAGES_TO_STRIP` do `.pnpmfile.cjs`.
2. Pedir ao admin do Replit para permitir os pacotes no firewall.
3. Configurar `.npmrc`/`registry` do repl para um mirror aprovado.
4. Como ultimo recurso, rodar so o workflow "Start application" (usa o
   node_modules ja instalado) e fazer as instalacoes fora do repl.

# O que NAO fazer

- Nao remover as deps de teste do `apps/web/package.json` na `develop`
  para "unblocar" o install — isso quebra o CI e apaga a suite de
  testes do front. Use o `.pnpmfile.cjs` no lugar.
- Nao ignorar o 403 nem retentar em loop; e uma decisao de seguranca
  do Replit, nao um erro de rede transitorio.
- Nao ampliar o gate do `.pnpmfile.cjs` para casos alem do dev preview
  do Replit — o hook precisa ser no-op no CI e no deployment.
