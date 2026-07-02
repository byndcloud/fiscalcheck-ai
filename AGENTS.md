# AGENTS.md

Instruções para **qualquer coding agent** (Claude, GPT, Cursor, Replit Agent, Copilot, etc.) que atue neste repositório.

> Este arquivo é a **fonte da verdade** sobre como agentes devem se comportar no FiscalCheck AI. Arquivos como `CLAUDE.md` apenas estendem o que está aqui.

---

## 1. Princípios não-negociáveis

### 1.1 Human-in-the-loop

A plataforma é **agêntica**, mas o auditor é sempre o decisor.

- Agentes **preparam, recomendam e instruem**. Nunca executam ações com efeito sobre o contribuinte sem aprovação humana registrada.
- Toda ação efetiva (intimação, abertura de fiscalização, lançamento) exige `auditor_id` autenticado, timestamp e justificativa.
- Logs de decisão são **imutáveis** (append-only). Não há `UPDATE` ou `DELETE` em tabelas de auditoria.

### 1.2 Sigilo fiscal e LGPD

- Dados identificáveis (CPF, CNPJ, razão social, valores declarados) são **sigilosos** (art. 198 do CTN + LGPD).
- Antes de qualquer treinamento de modelo ou envio a LLM externo, aplique **pseudonimização** (hashing com salt).
- Nunca commitar dados reais. Use `docs/compliance/politica-retencao.md` como referência.
- Nunca logar dados identificáveis em níveis `INFO`/`DEBUG`. Use `audit` (estruturado) com correlation ID.

### 1.3 RBAC e MFA

- Todo endpoint que retorna ou modifica dado de contribuinte exige autenticação + autorização por papel.
- Papéis (preliminares): `auditor`, `supervisor`, `admin`, `cidadao`, `agente_sistema`.
- MFA obrigatório para `auditor`, `supervisor`, `admin`.

### 1.4 Idioma

- Documentação, comentários relevantes, mensagens de UI e mensagens de erro voltadas ao auditor: **pt-BR**.
- Identificadores de código (variáveis, funções, classes): **inglês** (`riskScore`, não `pontuacaoDeRisco`).
- Mensagens de log estruturado: inglês (mais fácil para ferramentas de SRE).
- Commits: pt-BR no escopo, inglês ou pt-BR no resumo (ambos aceitos).

---

## 2. Arquitetura

Monorepo `pnpm`:

```text
apps/web    → Next.js 15 (App Router) + TS + Tailwind v4 + shadcn/ui
apps/api    → FastAPI + Python 3.12 + LangGraph + Polars + SQLAlchemy
packages/*  → tipos TS compartilhados, configs Biome/TS
docs/       → arquitetura, ADRs, compliance, módulos, design system
infra/      → docker-compose para dev local
```

Detalhes em [`docs/architecture/overview.md`](./docs/architecture/overview.md).

### 2.1 Onde colocar código

| Tipo de mudança | Lugar |
| --- | --- |
| Componente de UI reutilizável | `apps/web/components/ui/` (se shadcn) ou `apps/web/components/` |
| Página/rota nova | `apps/web/app/.../page.tsx` |
| Endpoint REST | `apps/api/src/fiscalcheck_api/modules/<modulo>/router.py` |
| Modelo SQLAlchemy | `apps/api/src/fiscalcheck_api/modules/<modulo>/models.py` |
| Agente LangGraph | `apps/api/src/fiscalcheck_api/agents/<nome>/graph.py` |
| Migration | `apps/api/alembic/versions/` (gerado por `alembic revision --autogenerate`) |
| Tipo TS compartilhado | `packages/shared-types/` (gerado do OpenAPI, **não editar à mão**) |

### 2.2 Mapa dos 7 módulos → pastas

| Módulo | Pasta |
| --- | --- |
| 1. Ingestão e Qualidade | `apps/api/src/fiscalcheck_api/modules/ingestion/` |
| 2. Cruzamento e Detecção | `apps/api/src/fiscalcheck_api/modules/crossing/` |
| 3. IA Preditiva | `apps/api/src/fiscalcheck_api/modules/ai/` |
| 4. Gestão da Fiscalização | `apps/api/src/fiscalcheck_api/modules/cases/` |
| 5. Monitoramento | `apps/api/src/fiscalcheck_api/modules/analytics/` |
| 6. Segurança e Conformidade | `apps/api/src/fiscalcheck_api/modules/compliance/` |
| 7. Suporte e Copilot | `apps/api/src/fiscalcheck_api/modules/support/` |

---

## 3. Comandos essenciais

```powershell
pnpm install            # instalar dependências do monorepo
pnpm dev                # web + api em paralelo
pnpm web:dev            # apenas Next.js
pnpm api:dev            # apenas FastAPI
pnpm lint               # Biome (web) + Ruff (api)
pnpm typecheck          # tsc + pyright
pnpm test               # Vitest + pytest
pnpm build              # build de produção do web

# No apps/api:
uv sync                 # instalar deps Python
uv run alembic upgrade head           # aplicar migrations
uv run alembic revision --autogenerate -m "msg"
uv run pytest -q
```

---

## 4. Convenções de código

### 4.1 TypeScript / Next.js (apps/web)

- **App Router** apenas. Sem Pages Router.
- **Server Components por padrão**; marcar `"use client"` só onde necessário (interatividade, hooks, browser APIs).
- **TanStack Query v5** para todo fetch de dados do servidor. Sem `useEffect` para fetch.
- **Zustand** apenas para estado de UI local (sidebars, modais, filtros globais). Estado de servidor é Query.
- **Tipagem estrita**: `noImplicitAny`, `strict: true`. Nunca usar `any` em código novo.
- **Tipos do backend**: importar de `@fiscalcheck/shared-types` (gerados do OpenAPI, não editar à mão).
- **Path aliases**: `@/*` aponta para `apps/web/`.

### 4.2 Python / FastAPI (apps/api)

- **Python 3.12** com type hints completos. Prefira sintaxe nativa PEP 604 (`str | None`) e PEP 695 (`type X = ...`). `from __future__ import annotations` é **permitido** quando ajuda em forward refs, evita import circular ou habilita `TYPE_CHECKING` para reduzir custo de runtime — não remova quando já estiver presente.
- **Pydantic v2** para schemas (request/response).
- **SQLAlchemy 2.0** com sintaxe nova (`select()`, `Mapped[]`, `mapped_column()`).
- **async/await** em endpoints; `sync_to_async` para libs bloqueantes.
- **Estrutura por módulo**: cada pasta em `modules/` tem `router.py`, `schemas.py`, `service.py`, `models.py`, `repository.py`.
- **Sem `# type: ignore`** sem comentário explicando o motivo.
- **Sem prints**. Use `structlog` (configurado em `core/logging.py`).
- **Lint:** Ruff (regras em `apps/api/ruff.toml`). `uv run ruff check` deve passar.

### 4.3 Mensagens de erro voltadas ao auditor

- Em **pt-BR**, claras, sem jargão técnico.
- Sem stack trace ou path interno na resposta da API (vai para log estruturado).
- Sempre incluir `error_code` (string estável) + `correlation_id`.

---

## 5. Testes

- Toda regra fiscal nova **exige teste**.
- Smoke tests existem em ambos apps (`pnpm test` deve passar verde no CI).
- Para cruzamentos (módulo 2) e score de risco (módulo 3), criar **golden tests** com casos sintéticos auditáveis.
- Não use dados reais de contribuintes em testes. Use fixtures pseudonimizadas em `apps/api/tests/fixtures/`.

---

## 6. Segurança ao trabalhar

- **Nunca commitar:** `.env`, dumps de banco, dados reais, chaves privadas, tokens.
- **Antes de pedir code review:** rodar `pnpm lint && pnpm typecheck && pnpm test`.
- **Pre-commit hook (Husky) já bloqueia** lint quebrado e mensagem de commit fora do padrão.
- **CI bloqueia merge** se `web-lint`, `web-typecheck`, `web-build`, `web-test`, `api-lint`, `api-typecheck`, `api-test` falharem.

---

## 7. Quando estiver em dúvida

1. Consulte [`docs/architecture/overview.md`](./docs/architecture/overview.md).
2. Consulte [`docs/adr/`](./docs/adr/) para entender decisões já tomadas.
3. Consulte [`docs/modules/`](./docs/modules/) para spec do módulo correspondente.
4. Para conformidade, consulte [`docs/compliance/`](./docs/compliance/).
5. Para design, consulte [`docs/design-system/`](./docs/design-system/).
6. Se ainda houver dúvida, **pergunte ao usuário antes de adivinhar** — especialmente em decisões com efeito jurídico, fiscal ou de privacidade.

---

## 8. Anti-padrões (não faça)

- ❌ Executar ação com efeito sobre o contribuinte sem aprovação registrada.
- ❌ Logar CPF/CNPJ/valor em nível INFO/DEBUG.
- ❌ Mandar dados identificáveis para LLM externo sem pseudonimização.
- ❌ Editar arquivos em `packages/shared-types/` à mão (regenerar do OpenAPI).
- ❌ Adicionar dependência pesada sem ADR justificando.
- ❌ Usar `any` em TS ou `# type: ignore` em Python sem justificativa.
- ❌ Fazer `force push` em `main` ou `develop`.
- ❌ Criar tabela de auditoria mutável (audit logs são append-only).
