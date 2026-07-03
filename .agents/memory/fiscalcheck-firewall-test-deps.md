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

Se o firewall do Replit continuar bloqueando esses pacotes,
`pnpm install` no repl vai falhar ate que a policy do firewall seja
ajustada (mirror interno, allowlist, etc.). Mitigacoes possiveis, em
ordem de preferencia:

1. Pedir ao admin do Replit para permitir os pacotes no firewall.
2. Configurar `.npmrc`/`registry` do repl para um mirror aprovado.
3. Como ultimo recurso, rodar so o workflow "Start application" (usa o
   node_modules ja instalado) e fazer as instalacoes fora do repl.

# O que NAO fazer

- Nao remover as deps de teste do `apps/web/package.json` na `develop`
  para "unblocar" o install — isso quebra o CI e apaga a suite de
  testes do front.
- Nao ignorar o 403 nem retentar em loop; e uma decisao de seguranca
  do Replit, nao um erro de rede transitorio.
