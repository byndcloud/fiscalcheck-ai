# 00 — Contexto FiscalCheck AI (leitura obrigatória)

> Primeira referência da skill `backend`. Carrega princípios não-negociáveis, mapa de pastas e comandos do `apps/api`. As demais referências dependem destas decisões.

---

## 1. Princípios não-negociáveis (resumo de [`AGENTS.md`](../../../../AGENTS.md))

1. **Human-in-the-loop** — agentes preparam, recomendam, instruem. **Nunca** executam ação com efeito sobre o contribuinte sem aprovação humana registrada.
2. **Sigilo fiscal (art. 198 CTN) + LGPD** — pseudonimização antes de treino/LLM externo; PII não vai para log `INFO`/`DEBUG`.
3. **RBAC + MFA** — todo endpoint com dado de contribuinte exige autenticação + autorização por papel; MFA para `auditor`/`supervisor`/`admin`.
4. **Audit log append-only** — sem `UPDATE`, sem `DELETE`. Migrations imutáveis depois de aplicadas em produção.
5. **Idioma** — documentação, mensagens de erro ao auditor e docstrings de regra fiscal em **pt-BR**; identificadores e logs estruturados em **inglês**.

## 2. Mapa do `apps/api`

```
apps/api/
├── pyproject.toml          # deps + config Ruff/Pyright/pytest
├── alembic.ini             # config Alembic (sync URL)
├── ruff.toml               # extra (lint mais estrito)
├── alembic/
│   ├── env.py              # bootstrap (lê DATABASE_URL_SYNC)
│   ├── script.py.mako
│   └── versions/           # ⚠ IMUTÁVEL depois de aplicadas em prod
└── src/fiscalcheck_api/
    ├── __init__.py         # __version__
    ├── main.py             # create_app() + middlewares + /health
    ├── core/
    │   ├── config.py       # Settings (Pydantic) — segredos
    │   ├── logging.py      # structlog + CorrelationIdMiddleware
    │   └── security.py     # hash, JWT, pseudonymize() HMAC-SHA256
    ├── db/
    │   ├── base.py         # Base = DeclarativeBase
    │   └── session.py      # engine async + get_db_session()
    ├── auth/               # (placeholder) login/MFA — sprint dedicada
    ├── agents/             # LangGraph — cada agente = pasta com graph.py
    └── modules/
        ├── ingestion/      # Módulo 1: ETL Polars
        ├── crossing/       # Módulo 2: declarado × NFS-e + grafo
        ├── ai/             # Módulo 3: score, XAI, active learning
        ├── cases/          # Módulo 4: orquestrador, dossiê, multicanal
        ├── analytics/      # Módulo 5: dashboards, alertas
        ├── compliance/     # Módulo 6: RBAC, MFA, audit log
        └── support/        # Módulo 7: copilot, simulador, geofiscalização
```

Mapa módulo → pasta também em [`AGENTS.md` §2.2](../../../../AGENTS.md).

## 3. Stack fixa (não introduzir alternativas sem ADR)

| Camada | Decisão | Onde |
|---|---|---|
| Web framework | **FastAPI** 0.115 | [`main.py`](../../../../apps/api/src/fiscalcheck_api/main.py) |
| Schemas | **Pydantic v2** + `pydantic-settings` | [`core/config.py`](../../../../apps/api/src/fiscalcheck_api/core/config.py) |
| ORM | **SQLAlchemy 2.0** com sintaxe nova (`Mapped[]`, `mapped_column`, `select()`) | [`db/base.py`](../../../../apps/api/src/fiscalcheck_api/db/base.py) |
| Driver | **asyncpg** (app async) + **psycopg** (Alembic sync) | [`db/session.py`](../../../../apps/api/src/fiscalcheck_api/db/session.py) |
| Migrations | **Alembic** 1.14 | [`alembic/env.py`](../../../../apps/api/alembic/env.py) |
| ETL | **Polars** + PyArrow | (a usar em `modules/ingestion/`) |
| Cliente HTTP | **httpx.AsyncClient** | (não `requests`) |
| Agentes | **LangGraph** 0.2 (human-in-the-loop nativo) | `agents/` |
| Vetores | **pgvector** | DB |
| Grafo | **NetworkX in-memory** no MVP (ver [`ADR-0002`](../../../../docs/adr/0002-database-mvp-replit.md)); AGE em fase 2 |
| ML clássico | **scikit-learn** | `modules/ai/` |
| Logging | **structlog** estruturado JSON | [`core/logging.py`](../../../../apps/api/src/fiscalcheck_api/core/logging.py) |
| Auth | bcrypt (passlib) + JWT (python-jose) + pyotp (MFA) | [`core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py) |
| Lint/format | **Ruff** ([`ruff.toml`](../../../../apps/api/ruff.toml)) — regras `E,W,F,I,B,C4,UP,N,S,A,DTZ,EM,PIE,PL,RUF,SIM,TID,TCH` |
| Type-check | **Pyright** standard mode |
| Testes | **pytest** + `pytest-asyncio` (modo `auto`) + `httpx.AsyncClient` |
| Pacotes | **uv** (não pip puro) |

## 4. Comandos essenciais (rodar dentro de `apps/api/`)

```powershell
uv sync                                       # instala deps + dev
uv run uvicorn fiscalcheck_api.main:app --reload --port 8000
uv run alembic upgrade head                   # aplica migrations
uv run alembic revision --autogenerate -m "msg"
uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest -q
uv run pytest -m "not slow"                   # exclui marcador slow
```

Do root do monorepo (atalhos via `package.json`):

```powershell
pnpm --filter @fiscalcheck/api dev       # uvicorn
pnpm --filter @fiscalcheck/api lint
pnpm --filter @fiscalcheck/api typecheck
pnpm --filter @fiscalcheck/api test
pnpm --filter @fiscalcheck/api migrate   # alembic upgrade head
```

## 5. Configuração e segredos

`Settings` ([`core/config.py`](../../../../apps/api/src/fiscalcheck_api/core/config.py)) lê do `.env` e do ambiente. No Replit, **Secrets** injetam as env vars (não use `.env` físico em produção).

Variáveis mais sensíveis:

- `JWT_SECRET` (`openssl rand -hex 32`) — assinatura de JWT.
- `PSEUDONYMIZATION_SALT` (`openssl rand -hex 32`, **distinto** do JWT_SECRET) — entrada do HMAC-SHA256 em `pseudonymize()`.
- `DATABASE_URL` (async, `postgresql+asyncpg://...`) e `DATABASE_URL_SYNC` (sync, `postgresql+psycopg://...` — usada pelo Alembic).
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `LANGSMITH_API_KEY` — opcionais até módulos 3 e 7 entrarem.

Defaults com `change-me-...` falham no boot em `staging`/`production` (validator no `Settings`). Em `development` o app sobe — útil para scaffolding, perigoso fora dele.

## 6. Cadeia de custódia — `X-Correlation-Id`

[`core/logging.py`](../../../../apps/api/src/fiscalcheck_api/core/logging.py) define `CorrelationIdMiddleware`: a cada requisição, o header `X-Correlation-Id` é (a) lido se o cliente enviar válido, (b) gerado UUIDv4 senão, (c) propagado para todos os logs estruturados via `contextvars`, e (d) devolvido na resposta. Toda chamada ao banco / a serviços externos deve incluí-lo nos logs.

O frontend já propaga via [`apps/web/lib/api-client.ts`](../../../../apps/web/lib/api-client.ts).

## 7. Pseudonimização — `pseudonymize()`

[`core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py) — HMAC-SHA256 com `PSEUDONYMIZATION_SALT`. Propriedades:

- **Determinístico** — mesma entrada + mesmo salt = mesmo hash (útil para join entre tabelas anônimas).
- **Não-reversível** — sem o salt, não dá para inverter.
- **Distinto entre entradas diferentes** — alta resistência a colisão.

Use **sempre** antes de:

- Enviar a um LLM externo (OpenAI, Anthropic, etc.).
- Treinar/avaliar modelo ML.
- Exportar dataset para análise fora do produto.

## 8. Áreas críticas — mudança exige cuidado extra

| Path | Por quê |
|---|---|
| [`core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py) | Auth + pseudonimização. Bug = vazamento sistêmico. |
| [`core/config.py`](../../../../apps/api/src/fiscalcheck_api/core/config.py) | Segredos, validator de placeholders. |
| [`core/logging.py`](../../../../apps/api/src/fiscalcheck_api/core/logging.py) | Cadeia de custódia. |
| `modules/compliance/**` | RBAC, MFA, audit log append-only. Exige revisão humana com foco em segurança. |
| [`alembic/versions/*`](../../../../apps/api/alembic/versions/) | **Imutável** depois de aplicado. Sempre uma migration nova. |
| [`alembic/env.py`](../../../../apps/api/alembic/env.py) | URL sync, metadata. |

## 9. Anti-padrões específicos do FiscalCheck (lista curta)

- ❌ `print()` em qualquer arquivo de produção.
- ❌ `logger.info("processando %s", cnpj)` — PII em INFO/DEBUG.
- ❌ Endpoint sem `Depends(get_current_user)` se retornar dado de contribuinte.
- ❌ Editar arquivo existente em `alembic/versions/`.
- ❌ Enviar dado real a LLM externo sem `pseudonymize()`.
- ❌ Tabela de audit com permissão `UPDATE`/`DELETE` para o role do app.
- ❌ `requests` (sync) em endpoint async — use `httpx`.
- ❌ `select` sem filtro de escopo por papel quando o endpoint é de auditor (IDOR).
- ❌ Resposta de erro com stack trace (vai para o log estruturado, não para o cliente).
