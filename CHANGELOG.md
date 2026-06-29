# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento adota [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Added

- Scaffold inicial do monorepo (pnpm workspaces) com `apps/web` (Next.js 15) e `apps/api` (FastAPI).
- Estrutura dos 7 módulos do edital em `apps/api/src/fiscocheck_api/modules/`.
- Pastas `docs/` (architecture, adr, compliance, modules, design-system) e `.claude/skills/`.
- CI no GitHub Actions: lint, typecheck, build e test para web e api com paths-filter.
- Pre-commit hooks (Husky + lint-staged) e commitlint (Conventional Commits).
- Templates LGPD: RIPD, ROPA, política de retenção, runbook de incidente em 24h.
- `docker-compose` em `infra/` com PostgreSQL (pgvector + Apache AGE) e Redis.
- Configuração Replit (`.replit`, `replit.nix`) com workflows e portas.
- Documentação principal: `README.md`, `AGENTS.md`, `CLAUDE.md`, `replit.md`, `CONTRIBUTING.md`, `SECURITY.md`.

### Security

- Licença proprietária ("All Rights Reserved") adotada como default.
- `SECURITY.md` com política de divulgação responsável e SLA de resposta.
- `.gitignore` reforçado para impedir commit de `.env`, dumps de banco e dados de contribuintes.
