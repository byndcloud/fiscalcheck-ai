# ADR-0001: Stack inicial — monorepo pnpm, Next.js 15, FastAPI, PostgreSQL único

- **Status:** Accepted (parcialmente revisitado por [ADR-0002](./0002-database-mvp-replit.md))
- **Data:** 2026-06-29
- **Autor(es):** @owner-tech-lead
- **Revisores:** @owner-architect, @owner-backend, @owner-frontend

> **Nota (2026-06-29):** a estratégia de banco para o **MVP no Replit** foi revisitada em [ADR-0002](./0002-database-mvp-replit.md). MVP usa Postgres do Replit + `pgvector` apenas; **Apache AGE é adiado** para a migração à nuvem nacional. O restante desta ADR permanece inalterado.
>
> **Nota (2026-07-02):** a mitigação _"Renovate/Dependabot semanal"_ mencionada na seção `## Riscos` foi **desativada** na simplificação para o MVP no Replit. Version updates automáticos foram desligados; apenas **security updates** do Dependabot permanecem via configuração do repositório. Ver `## Simplificação para o MVP no Replit (2026-07-02)` no [`CHANGELOG.md`](../../CHANGELOG.md) e [`SECURITY.md`](../../SECURITY.md) §Vulnerabilidades para o estado atual.

## Contexto

O FiscalCheck AI atende ao Edital CPSI — Município de Brusque/SC, para uma plataforma de **inteligência fiscal agêntica** com:

- Agentes IA 24/7 (ingestão, cruzamento, calibragem, orquestração, copilot).
- ETL de grandes volumes (NFS-e, DIMP, ECD, DEFIS, PGDAS).
- Score de risco preditivo + graph analytics.
- UI rica para o auditor + portal para o cidadão.
- Conformidade total com LGPD e sigilo fiscal (art. 198 CTN).
- Hospedagem inicial no Replit (piloto).

Precisamos de uma stack que (i) seja pragmática para um time enxuto, (ii) tenha ecossistema maduro para IA/ML, (iii) caiba no Replit sem operadores externos, (iv) permita migrar para nuvem nacional na produção.

## Decisão

Adotar **monorepo pnpm workspaces** com:

- **`apps/web`** — Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Zustand + TanStack Query v5 + Biome.
- **`apps/api`** — FastAPI 0.115 + Python 3.12 (async) + SQLAlchemy 2.0 + Alembic + LangGraph + Polars + scikit-learn + Ruff + Pyright.
- **`packages/`** — `shared-types` (gerados do OpenAPI), `tsconfig`, `biome-config`.
- **Banco único: PostgreSQL 16** com extensões `pgvector` (embeddings/RAG) e `Apache AGE` (grafo).
- **Cache/fila: Redis 7.**
- **Replit** para o piloto; produção em **nuvem nacional** (AWS São Paulo, Azure Brazil South ou nuvem TCE-SC — a decidir em ADR posterior).
- **CI** no GitHub Actions com paths-filter e jobs separados para web e api.

## Consequências

### Positivas

- **Type-sharing** end-to-end (FastAPI gera OpenAPI → tipos TS no front).
- **Polars** sustenta o ETL de volumes fiscais (5–10x mais rápido que Pandas).
- **LangGraph** dá human-in-the-loop nativo, requisito do edital.
- **Banco único** simplifica backup, replicação e ops no piloto (sem cluster Neo4j separado).
- **Biome + Ruff** mantêm latência de lint baixa no Replit (IDE web).
- **Monorepo** permite refatorações cross-cutting (ex.: renomear um campo do contrato API/UI num único PR).
- **Tooling moderno** (pnpm, uv) com cache rápido na CI.

### Negativas / trade-offs

- **Python + Node** no mesmo repo aumenta a barreira de entrada (dev precisa saber os dois ou se especializar em uma fatia).
- **Postgres único** pode virar gargalo quando o grafo passar de ~100M arestas (mitigação: migração para Neo4j gerenciado, com janela planejada).
- **Replit** não é certificado para dados fiscais reais em produção (LGPD pede localização nacional); decisão consciente de pular para nuvem brasileira antes de processar dado real.
- **Active Learning + retrain** em produção exige MLOps que ainda não temos resolvido (ADR futuro).

### Riscos

- **Versões muito recentes** (Next.js 15 + React 19) podem ter rough edges (mitigação: pinar versões estáveis + Renovate/Dependabot semanal).
- **Apache AGE** tem comunidade menor que Neo4j (mitigação: encapsular acesso em `modules/crossing/graph/` para troca futura).
- **uv** ainda relativamente novo (mitigação: estável o suficiente para 1.0+; fallback para pip caso necessário).

## Alternativas consideradas

### A. Next.js fullstack (sem backend Python)

Tudo em TypeScript com Next.js API Routes / Server Actions, usando LangChain.js.

- **A favor:** uma linguagem só; type-safety perfeita.
- **Contra:** ecossistema TS para ML/agentes é menos maduro; Polars não tem equivalente; modelos sklearn não rodam. **Rejeitada.**

### B. Dois repositórios (frontend e backend separados)

- **A favor:** isolamento total; deploy independente trivial.
- **Contra:** sincronização de contratos vira fricção; cada PR cross-cutting exige 2 PRs; menos atraente para um time pequeno. **Rejeitada.**

### C. Híbrido (BFF Node + workers Python)

Node faz API gateway/BFF; Python só roda como worker (Celery).

- **A favor:** type-safety com Next.js + Python onde realmente precisa.
- **Contra:** complexidade operacional alta (3 runtimes em produção); IPC entre Node e Python sob carga é frágil. **Rejeitada para a fase atual** — pode ser reavaliada se o gargalo se mostrar no FastAPI.

### D. Banco principal Postgres + Neo4j separado para grafo

- **A favor:** Neo4j é o estado da arte em graph DB.
- **Contra:** dois bancos para manter, backupar, replicar; custo + complexidade desproporcional ao volume do piloto. **Adiada** — reavaliar quando grafo ultrapassar limites do AGE.

### E. Monorepo Turborepo (em vez de pnpm puro)

- **A favor:** cache de builds entre máquinas.
- **Contra:** complexidade extra para um monorepo com só 2 apps; benefício marginal no piloto. **Rejeitada** — fácil adicionar depois se virar gargalo de CI.

## Como reverter

- **Sair de monorepo para 2 repos:** `git filter-repo` cada app — ~2 dias de trabalho + atualizar CI.
- **Sair de Postgres único para Postgres + Neo4j:** isolamento via `modules/crossing/graph/` permite troca controlada — ~1 sprint.
- **Sair de Python para Node fullstack:** muito caro (reescreve agentes, ETL, ML) — só vale se o backend não escalar mesmo após otimização.
- **Sair de Replit para nuvem direta:** já planejado para produção; questão de timing, não de reversão.

## Referências

- Edital CPSI — Município de Brusque/SC (Anexo I, TR, ETP, DFD).
- [Tailwind v4 release](https://tailwindcss.com/blog/tailwindcss-v4).
- [LangGraph human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/).
- [Apache AGE](https://age.apache.org/).
- [Polars vs Pandas benchmarks](https://h2oai.github.io/db-benchmark/).
- LGPD (Lei nº 13.709/2018).
- CTN, art. 198 (sigilo fiscal).
