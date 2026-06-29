# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento adota [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Added

- **Design System v1.0** documentado em `docs/design-system/design-system.md` (camada Aurora para IA, espectro de risco, foco visível 3px, motion respeitando `prefers-reduced-motion`).
- **shadcn/ui** integrado em `apps/web/components/ui/` (`button`, `card`, `input`) com variante `aurora` customizada para saídas de IA.
- **Fonte Rawline** auto-hospedada em `apps/web/app/fonts/` (OFL 1.1) + Roboto Mono para dados e KPIs.
- **`pnpm-lock.yaml`** committado para reprodutibilidade do build no Replit e em CI.
- **ADR-0002** (`docs/adr/0002-database-mvp-replit.md`): MVP usa Postgres Replit + `pgvector`; Apache AGE adiado para a migração à nuvem nacional. Módulo 2 implementa `GraphStore` com `NetworkXGraphStore` no MVP e `AgeGraphStore` na fase 2.
- **Skills FiscoCheck-aware**: `references/00-fiscocheck-context.md` em `frontend/`, `qa-test-strategist/`, `security-auditor/` carregando o recorte do domínio fiscal (LGPD, sigilo, design system, golden tests, áreas críticas).
- **Skill `backend/`** nova, em pt-BR, com `SKILL.md` + 5 references (contexto, estrutura de módulos, ETL Polars, agentes LangGraph, migrations Alembic, logging/pseudonimização).
- `infra/postgres-init-age.sql` (opt-in) e perfil `graph` no `docker-compose` para dev local que precise testar AGE em preparação à fase 2.
- Workflow `DB migrate` no `.replit` (`alembic upgrade head`).
- (Sprint anterior) Scaffold inicial do monorepo (pnpm workspaces) com `apps/web` (Next.js 15) e `apps/api` (FastAPI), estrutura dos 7 módulos, CI com paths-filter, hooks Husky + commitlint, templates LGPD (RIPD, ROPA, política de retenção, runbook 24h), `docker-compose` de dev, configuração Replit (`.replit`/`replit.nix`) e documentação principal (`README`, `AGENTS.md`, `CLAUDE.md`, `replit.md`, `CONTRIBUTING.md`, `SECURITY.md`).

### Changed

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
