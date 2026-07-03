# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento adota [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Changed — Reconciliação pós-simplificação e sprints T01–T19 (2026-07-03)

Fecha vestígios que a simplificação do MVP (2026-07-02) e as sprints T01–T19 deixaram na documentação. Nenhum código de runtime alterado (apenas 1 docstring).

- **Deps web reintroduzidas em T01**: `react-hook-form`, `zod` (v4) e `@hookform/resolvers` **voltaram** ao [`apps/web/package.json`](./apps/web/package.json) junto com a tela de login (T01) e são usadas em [`components/auth/login-form.tsx`](./apps/web/components/auth/login-form.tsx), [`components/ui/form.tsx`](./apps/web/components/ui/form.tsx) e telas subsequentes (T02, T19). A bullet "Dependências web podadas" da simplificação abaixo cobria o estado exato do commit `d7146a0`; a partir de T01 (commit `74428c3`) essas três deps voltaram. Apenas `@radix-ui/react-slot` continua fora (substituído por `radix-ui`).
- **Links quebrados de compliance**: [`docs/README.md`](./docs/README.md) e [`CONTRIBUTING.md`](./CONTRIBUTING.md) apontavam para `docs/compliance/lgpd.md` e `sigilo-fiscal-art-198-ctn.md` (consolidados em `docs/compliance/README.md`). Corrigido.
- **Menções a skills removidas**: [`README.md`](./README.md) mencionava "coding agents (frontend, backend, QA, security)" e o docstring de [`modules/compliance/__init__.py`](./apps/api/src/fiscalcheck_api/modules/compliance/__init__.py) apontava para a skill `security-auditor` que não existe mais. Corrigido para listar apenas skills ativas (`frontend`, `backend`) e apontar para revisão humana + `docs/compliance/README.md`.
- **Skill `backend`**: linha `Auth` de [`references/00-fiscalcheck-context.md`](./.claude/skills/backend/references/00-fiscalcheck-context.md) atualizada para refletir a substituição `passlib`/`python-jose`/`pyotp` → `bcrypt` (direto) + PyJWT (com nota de MFA voltando no módulo 6).
- **Skill `frontend`**: [`references/00-fiscalcheck-context.md`](./.claude/skills/frontend/references/00-fiscalcheck-context.md) removeu ponteiros para references genéricas já excluídas (`01-component-patterns.md`, `06-design-tokens.md`) e corrigiu a linha "Tipos do backend" — no MVP são manuais (contradizia [`AGENTS.md` §4.1](./AGENTS.md)).
- **[`replit.md`](./replit.md)** alinhado ao [ADR-0003](./docs/adr/0003-preview-replit.md): workflow default é `Project` (Next.js + MSW em `PORT=5000`), não `Dev (web + api)`; tabela de portas atualizada para `5000/8080/23345/8000` (o antigo `3000 → 80` foi removido para evitar colisão com `8080 → 80`); §Troubleshooting ganhou linhas sobre `LD_LIBRARY_PATH` e o firewall do Replit (com pointer para `.agents/memory/`). **`.replit`, `.pnpmfile.cjs`, `apps/web/next.config.ts` e scripts `dev`/`start` não foram tocados.**
- **[`apps/web/README.md`](./apps/web/README.md)** §Estrutura completada com as telas de T04 (`ingestion` timeline), T10 (`esteira-de-agentes` + `hooks/use-agents-feed.ts`), T13 (`cases` + `lib/case-transitions.ts`), T15 (`comunicacoes`), T02 (`modelo-de-risco` + `lib/risk-model/simulate.ts`) e T19 (`compliance/{trilha,usuarios}` + `components/compliance/` + `lib/masks.ts` + `lib/compliance/export-audit.ts`).
- **Claims de stack não instalada** qualificados: [`AGENTS.md` §2](./AGENTS.md) e [`docs/architecture/overview.md` §Stack](./docs/architecture/overview.md) marcam LangGraph/Polars/scikit-learn/NetworkX/Redis como "não instalado — entra com o módulo que usa". [`modules/crossing/__init__.py`](./apps/api/src/fiscalcheck_api/modules/crossing/__init__.py) alinhado ao ADR-0002 (NetworkX in-memory, AGE adiado).
- **[`ADR-0001`](./docs/adr/0001-stack-inicial.md)** ganha nota curta datada `2026-07-02` esclarecendo que a mitigação "Renovate/Dependabot semanal" foi desativada (pointer para este CHANGELOG e [`SECURITY.md`](./SECURITY.md)).

### Changed — Simplificação para o MVP no Replit (2026-07-02)

Enxugamento do repositório para o escopo real da fase de validação (MVP via Replit). Tudo o que foi removido permanece no histórico do git e volta quando o produto sair do piloto.

- **Automação GitHub removida**: workflow CodeQL, `dependabot.yml` (version updates desligados; security updates continuam via configuração do repositório), `scripts/dependabot/` e `CODEOWNERS` (placeholders). Issue #26 e PR #34 fechados.
- **Hooks de commit removidos**: Husky, commitlint, lint-staged e markdownlint saíram (arquivos + devDependencies + script `prepare`). Commits locais ficam instantâneos; a validação acontece no CI. Conventional Commits vira convenção recomendada (ver `CONTRIBUTING.md`).
- **CI consolidado**: de 8 jobs para 2 (`web`: lint+typecheck+test+build; `api`: ruff+pyright+pytest), mantendo o paths-filter. Job `docs-lint` removido.
- **Dependências Python podadas** (`apps/api/pyproject.toml`): removidos scikit-learn, numpy, networkx, polars, pyarrow, langgraph, langchain-core, redis, pgvector, pyotp, tenacity, email-validator, python-multipart e python-json-logger (não usados pelo código atual — voltam com os módulos que os usam). `passlib`+`python-jose` (sem manutenção) substituídos por `bcrypt`+`PyJWT` em `core/security.py`. `uv.lock` regravado (60 pacotes a menos).
- **Dependências web podadas**: `react-hook-form`, `@hookform/resolvers`, `zod` e `@radix-ui/react-slot` removidos (não importados; voltam com as telas de formulário).
- **Docs de compliance consolidadas**: os 6 documentos de `docs/compliance/` viraram um `README.md` único com o resumo LGPD/sigilo/retenção/incidente para o MVP.
- **Skills enxugadas**: `qa-test-strategist/` e `security-auditor/` removidas; skill `frontend` reduzida a `SKILL.md` + contexto FiscalCheck (references genéricas, assets e scripts removidos); skill `backend` mantida integralmente.
- **`config.py`**: campo `redis_url` removido (Redis está fora do MVP).

### Fixed — Inconsistências identificadas no diagnóstico (2026-07-02)

- **`infra/docker-compose.yml`**: o perfil `default` não subia com `docker compose up` (perfil "default" não é especial no Compose) — postgres agora é serviço sem perfil; imagem trocada de `postgres:16-alpine` (sem pgvector — o init falharia) para `pgvector/pgvector:pg16`; `redis` e `mailhog` removidos; `postgres-age` (perfil `graph`) movido para a porta 5433.
- **Redis "gerenciado pelo Replit" não existe**: `replit.md`, `replit.nix` e `.replit` corrigidos — o Replit só oferece Postgres gerenciado; Redis fica documentado como decisão futura (provedor externo ou nuvem nacional, via ADR).
- **`.replit [deployment]`** rodava `pnpm dev` (dev servers com `--reload`/`--turbo`) no Cloud Run — agora faz build de produção (`pnpm build` + `uv sync`) e roda `next start` + `uvicorn` sem reload.
- **`replit.nix`** duplicava Node/Python já provisionados pelos `modules` do `.replit` — reduzido a pnpm, uv e utilitários.
- **`.env.example` (raiz)** usava `postgresql://` sem driver, divergindo de `apps/api` — alinhado para `postgresql+asyncpg://`; `REDIS_URL` e blocos de provedores não usados removidos.
- **`AGENTS.md`/`apps/api/README.md`** descreviam estrutura por módulo (`router.py`, `service.py`...) que não existe — marcada explicitamente como estrutura alvo.
- **`packages/shared-types`** dizia "gerado do OpenAPI, não editar à mão" mas só continha tipos manuais com a geração comentada — documentação corrigida: tipos manuais são aceitos até a geração ser ativada. Adicionada dependência `@fiscalcheck/tsconfig` que faltava (typecheck falhava).
- **`CONTRIBUTING.md`/`README.md`** documentavam fluxo `main` ← `develop`, mas `main` não existe no remoto — documentação alinhada à realidade (`develop` é default; `main` nasce na primeira release).
- **`apps/web`** reformatado com `biome check --write` (15 arquivos com indentação/EOL fora do padrão do lint).

### Added

- **Design System v2.0** documentado em `docs/design-system/design-system.md` (camada Aurora para IA, espectro de risco, foco visível 3px, motion respeitando `prefers-reduced-motion`).
- **shadcn/ui** integrado em `apps/web/components/ui/` (`button`, `card`, `input`) com variante `aurora` customizada para saídas de IA.
- **Pilha tipográfica v2.0** servida via Google Fonts — **Raleway** (UI, 400–800), **Montserrat** (display numérico de KPIs, scores e valores hero, 600–800) e **Roboto Mono** (identificadores, CNPJ, protocolos, competências, contadores, valores em linhas de tabela, 400–700). A **Rawline** auto-hospedada em `apps/web/app/fonts/` (OFL 1.1) permanece como equivalente institucional aceito para contextos gov.br, entrando apenas como fallback declarativo em `--font-ui`.
- **`pnpm-lock.yaml`** committado para reprodutibilidade do build no Replit e em CI.
- **ADR-0002** (`docs/adr/0002-database-mvp-replit.md`): MVP usa Postgres Replit + `pgvector`; Apache AGE adiado para a migração à nuvem nacional. Módulo 2 implementa `GraphStore` com `NetworkXGraphStore` no MVP e `AgeGraphStore` na fase 2.
- **Skills FiscalCheck-aware**: `references/00-fiscalcheck-context.md` em `frontend/`, `qa-test-strategist/`, `security-auditor/` carregando o recorte do domínio fiscal (LGPD, sigilo, design system, golden tests, áreas críticas).
- **Skill `backend/`** nova, em pt-BR, com `SKILL.md` + 5 references (contexto, estrutura de módulos, ETL Polars, agentes LangGraph, migrations Alembic, logging/pseudonimização).
- `infra/postgres-init-age.sql` (opt-in) e perfil `graph` no `docker-compose` para dev local que precise testar AGE em preparação à fase 2.
- Workflow `DB migrate` no `.replit` (`alembic upgrade head`).
- (Sprint anterior) Scaffold inicial do monorepo (pnpm workspaces) com `apps/web` (Next.js 15) e `apps/api` (FastAPI), estrutura dos 7 módulos, CI com paths-filter, hooks Husky + commitlint, templates LGPD (RIPD, ROPA, política de retenção, runbook 24h), `docker-compose` de dev, configuração Replit (`.replit`/`replit.nix`) e documentação principal (`README`, `AGENTS.md`, `CLAUDE.md`, `replit.md`, `CONTRIBUTING.md`, `SECURITY.md`).

### Changed

- **Design System v1.0 → v2.0** (`docs/design-system/design-system.md`). Face primária de UI passou de **Rawline** para **Raleway** (Rawline permanece como equivalente institucional aceito, não canônica). Adicionada **Montserrat** como face de display numérico (KPIs 25/700, medidor 48/800, valor hero 35/800, valor secundário 19–22/700). **Roboto Mono** restrita a identificadores e dados tabulares miúdos (IDs, CNPJ, protocolos, competências, contadores, valores em linhas de tabela). Escala recalibrada para densidade de painel. Componentes revisados: KPI card (label caps + tile de ícone tingido + valor Montserrat + pílula de tendência mono), tabela de casos (score-chip + microtag `AGENTE`), navegação lateral 252px, barra superior com botão Copilot em gradiente Aurora animado, filtros em chip, botões-cartão, Copilot Fiscal em card claro. Novos padrões de domínio documentados: Próxima melhor ação, Análise de Redes, barra de fluxo agêntico, recorte mobile do canal do cidadão. Medidor de score passa a exibir número central em Montserrat 48/800 na cor do nível. Paleta (§3), espaçamento, raios, elevação (§5) e curvas/durações de movimento (§6) inalterados. **Nota**: componentes novos ainda não implementados no frontend — apenas configuração de fontes (`apps/web/app/layout.tsx`, `apps/web/app/globals.css`) e tokens foram alinhados nesta rodada; os componentes de domínio ficam para sprints dedicados.
- **`Settings` agora falha rápido em staging/produção** se `JWT_SECRET` ou `PSEUDONYMIZATION_SALT` ainda forem os placeholders (`change-me-*`). Em `development`/`test` continuam tolerados para scaffolding.
- **`CLAUDE.md` §1** reconciliado para refletir as 4 skills reais (`frontend`, `backend`, `qa-test-strategist`, `security-auditor`) com seus nomes corretos.
- **`AGENTS.md` §4.2**: `from __future__ import annotations` passa de proibido a *permitido quando útil* (forward refs, `TYPE_CHECKING`, imports circulares) — alinhando a regra ao código já existente.
- **`.replit`**: `[[ports]]` 5432 e 6379 removidos (Postgres e Redis no Replit são serviços gerenciados, não locais). Bloco `[deployment]` agora sobe web + api em paralelo, com nota de que Replit Deployments serve apenas como ambiente de piloto/demo.
- **`replit.nix`**: postgres/redis CLIs ficam como fallback local, com comentário explicando que os serviços efetivos são os gerenciados pelo Replit.
- **`apps/web`** reformatado pelo Biome para padronizar indentação em espaços (2) e organizar imports em todos os arquivos.
- **`apps/api`** com lint Ruff e Pyright limpos: imports `TYPE_CHECKING`, constante `MAX_CORRELATION_ID_LENGTH`, tipagem do processor de structlog.
- README, `docs/architecture/overview.md`, `replit.md`, `.env.example`, `apps/api/.env.example` e `infra/postgres-init.sql` atualizados para refletir AGE como opt-in.

### Security

- `SECURITY.md` com política de divulgação responsável e SLA de resposta.
- `.gitignore` reforçado para impedir commit de `.env`, dumps de banco e dados de contribuintes.
- Validator de `Settings` impede que segredos placeholder vazem para boot em staging/produção.

### Pending

- Definição de licença do projeto (a abordar em sprint posterior).
- Implementação dos 7 módulos (sprints dedicados por módulo).
- Migrations Alembic do modelo de dados de auditoria (dependem do módulo 6 — Compliance).
