# Major bumps pendentes — backlog de migração

Este issue agrupa todos os bumps de major que o dependabot detectou e tentou
abrir como PR mas que foram fechados (política do projeto: majors são
sempre manuais, em branch dedicada, com revisão humana). Ver
[`.github/dependabot.yml`](../.github/dependabot.yml) e
[`AGENTS.md`](../AGENTS.md).

A cada item, abrir uma branch `chore/upgrade-<pacote>-vN` quando for a hora
de migrar, fazer os ajustes de código, e linkar o PR aqui.

---

## Frontend (`apps/web` + workspace root)

### Runtime (alto impacto — exige varredura no código)

- [ ] **`tailwind-merge` 2.x → 3.x** — utilitário de merge de classes
      Tailwind. Verificar uso após bump.
      [Changelog](https://github.com/dcastil/tailwind-merge/releases)
- [ ] **`zod` 3.x → 4.x** — breaking em `z.string()`, `z.coerce`, error
      customization. Varrer [`apps/web/`](../apps/web/) e
      [`packages/shared-types/`](../packages/shared-types/).
      [Migration guide](https://zod.dev/v4/changelog)
- [ ] **`lucide-react` 0.x → 1.x** — estabilização 1.0. Conferir nomes
      de ícones renomeados/removidos.
      [Release 1.0](https://github.com/lucide-icons/lucide/releases)
- [ ] **`@hookform/resolvers` 3.x → 5.x** — dois majors. Revisar todos
      os `useForm({ resolver: ... })` em `apps/web/`.
      [Releases](https://github.com/react-hook-form/resolvers/releases)
- [ ] **`next` 15.x → 16.x** — major do framework. Revisar App Router,
      middleware, server actions, `next.config`.
      [Upgrade guide](https://nextjs.org/docs/app/building-your-application/upgrading)

### Tooling de teste / build (médio impacto)

- [ ] **`vitest` 2.x → 4.x** — subir incrementalmente (2 → 3 → 4).
      Cuidado com `vi.mock`, `setupFiles`, coverage.
      [Migration](https://vitest.dev/guide/migration.html)
- [ ] **`@vitejs/plugin-react` 4.x → 6.x** — migrar junto com vitest.
      [Releases](https://github.com/vitejs/vite-plugin-react/releases)
- [ ] **`jsdom` 25.x → 29.x** — só tocar se a suite exigir. Baixa
      prioridade.
      [Releases](https://github.com/jsdom/jsdom/releases)
- [ ] **`@biomejs/biome` 1.x → 2.x** — refatoração de config; regras
      podem ter mudado de nome ou severidade.
      [Changelog](https://github.com/biomejs/biome/blob/main/CHANGELOG.md)
- [ ] **`@commitlint/cli` 19.x → 21.x** (e
      `@commitlint/config-conventional` mesmo salto) — revisar
      `commitlint.config.js` se houver custom rules.
- [ ] **`lint-staged` 15.x → 17.x** — revisar `.lintstagedrc` ou bloco
      no `package.json` raiz.
- [ ] **`typescript` 5.x → 6.x** — checar regras estritas novas; rodar
      `pnpm typecheck` é o teste.
- [ ] **`@types/node` 22.x → 26.x** — alinhar com `engines.node` do
      workspace ([`package.json`](../package.json)).

---

## Backend (`apps/api`)

### Runtime crítico (alto impacto)

- [ ] **`fastapi` 0.115 → 0.138** (constraint `<0.116`) — 0.x mas é
      runtime principal. Revisar releases entre 0.116 e 0.138 para
      breaking changes em DI, lifespan, middleware.
- [ ] **`uvicorn` 0.32 → 0.49** (constraint `<0.33`) — relaxar junto
      com fastapi.
- [ ] **`langgraph` 0.2 → 1.x** + **`langchain-core` 0.3 → 1.x** —
      release 1.0 das libs de agentes. Migrar agentes em
      [`apps/api/src/fiscocheck_api/agents/`](../apps/api/src/fiscocheck_api/agents/)
      conforme [release notes](https://github.com/langchain-ai/langgraph/releases).
- [ ] **`redis` 5.x → 6/7/8** (constraint `<6`) — verificar API de
      `redis.asyncio` se mudou.
- [ ] **`pyarrow` 18 → 24** — ETL Polars depende disso; rodar suite de
      ingestão.

### Infra / observabilidade (médio impacto)

- [ ] **`structlog` 24 → 25/26** — checar pipeline de processors em
      [`core/logging.py`](../apps/api/src/fiscocheck_api/).
- [ ] **`python-json-logger` 2 → 3/4** — pode coexistir com structlog
      mas vale revalidar.
- [ ] **`python-multipart` 0.0.19 → 0.0.32** — uploads HTTP; revisar
      endpoints de upload.
- [ ] **`asyncpg` 0.30 → 0.31** + **`pgvector` 0.3 → 0.4** — driver de
      Postgres + pgvector; rodar testes de DB.

### Dev tooling

- [ ] **`pytest` 8 → 9** + **`pytest-asyncio` 0.24 → 1.x** +
      **`pytest-cov` 6 → 7** — bumpar juntos; revisar fixtures async
      após `pytest-asyncio` 1.0.
- [ ] **`ruff` 0.8 → 0.15** — várias regras adicionadas/renomeadas.
      Rodar `uv run ruff check --add-noqa` ajuda.
- [ ] **`ipython` 8 → 9** — só afeta REPL local.

---

## CI / GitHub Actions

> Política: por padrão `dependabot.yml` ignora majors também para
> github-actions. Se a equipe decidir relaxar essa política para esse
> ecossistema (majors de actions são geralmente seguros), remover o
> bloco `ignore` correspondente em
> [`.github/dependabot.yml`](../.github/dependabot.yml).

- [ ] **`actions/checkout` 4 → 7**
- [ ] **`actions/setup-node` 4 → 6**
- [ ] **`pnpm/action-setup` 4 → 6**
- [ ] **`github/codeql-action` 3 → 4**
- [ ] **`dorny/paths-filter` 3 → 4**

---

## Critérios de pronto

Para cada item:

1. Branch dedicada `chore/upgrade-<pacote>-v<N>`.
2. Commit de bump no `package.json` / `pyproject.toml` + lockfile
   (`pnpm-lock.yaml` ou `apps/api/uv.lock`).
3. Commits separados para ajustes de código (não misturar com o bump).
4. CI verde local antes de subir:
   - Frontend: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
   - Backend: `cd apps/api && uv run ruff check . && uv run pyright && uv run pytest -q`
5. PR com descrição linkando este issue, changelog do pacote, e lista de
   arquivos tocados.

## Adicionar novos itens

Sempre que o dependabot detectar um major novo (a config global
`ignore` agora barra antes de abrir, então isso só será visível em
auditoria de releases dos próprios pacotes), adicionar item aqui com:

- Nome do pacote
- Salto (de → para)
- Onde é usado no monorepo
- Link para changelog/migration guide

---

## Follow-ups operacionais

### Verificar `uv.lock` no primeiro PR `pip` do dependabot

CI da API roda `uv sync --frozen` ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)),
que exige `apps/api/uv.lock` consistente com `pyproject.toml`. Quando o
primeiro PR `pip` aparecer após a refatoração:

- [ ] Verificar se o PR contém commit alterando `apps/api/uv.lock`
      junto com `apps/api/pyproject.toml`.
- [ ] Se SIM → ok, nada a fazer.
- [ ] Se NÃO → criar `.github/workflows/dependabot-uv-lock.yml` que
      roda `uv lock` em branches `dependabot/pip/**` e commita de volta
      (token com `contents: write` restrito a essas branches).
- [ ] Se a fricção for grande → abrir ADR em `docs/adr/` propondo
      migração para **Renovate** (suporte nativo a `uv.lock`),
      mantendo dependabot para `npm` e `github-actions` apenas.
