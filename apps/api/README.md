# @fiscalcheck/api

Backend **FastAPI** do FiscalCheck AI — agentes IA 24/7, ETL multifonte, ML preditivo, graph analytics.

## Stack

Instalado no MVP:

- **Python 3.12** com type hints completos
- **FastAPI 0.115+** (async)
- **SQLAlchemy 2.0** (async) + **Alembic** para migrations
- **PostgreSQL 16** + `pgvector` (Apache AGE adiado — ver [ADR-0002](../../docs/adr/0002-database-mvp-replit.md))
- **structlog** para logging estruturado com correlation-id
- **bcrypt** + **PyJWT** para hashing de senha e tokens
- **Ruff** (lint + format) + **Pyright** (typecheck)
- **pytest** + **pytest-asyncio** + **httpx** para testes
- **uv** para dependências (substitui pip/poetry)

Entra junto com os módulos correspondentes (stack decidida em [ADR-0001](../../docs/adr/0001-stack-inicial.md), mas não instalada até ser usada): **Polars** (ETL), **LangGraph** (agentes), **scikit-learn** + **NetworkX** (score/grafos), **Redis** (cache/fila), **pgvector** client, **pyotp** (MFA).

## Setup

```powershell
cd apps/api
uv sync               # instala todas as dependências
copy .env.example .env
```

Para o Postgres do desenvolvimento, suba via Docker:

```powershell
docker compose -f ../../infra/docker-compose.yml up -d
```

## Scripts (via pnpm na raiz)

```powershell
pnpm --filter @fiscalcheck/api dev        # uvicorn com reload em :8000
pnpm --filter @fiscalcheck/api lint       # ruff check + format check
pnpm --filter @fiscalcheck/api lint:fix   # ruff --fix
pnpm --filter @fiscalcheck/api typecheck  # pyright
pnpm --filter @fiscalcheck/api test       # pytest
pnpm --filter @fiscalcheck/api migrate    # alembic upgrade head
```

Ou direto via `uv`:

```powershell
uv run uvicorn fiscalcheck_api.main:app --reload --port 8000
uv run ruff check .
uv run pyright
uv run pytest -q
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "msg"
```

## Documentação interativa

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- OpenAPI JSON: <http://localhost:8000/openapi.json>

O `openapi.json` é a fonte da verdade para os tipos TS em `packages/shared-types/`.

## Estrutura

```text
src/fiscalcheck_api/
├── main.py                # app FastAPI + middleware + lifespan
├── core/
│   ├── config.py          # Pydantic Settings (lê .env)
│   ├── logging.py         # structlog + correlation-id
│   └── security.py        # JWT, hashing, MFA helpers
├── auth/                  # rotas e dependências de auth (RBAC)
├── db/
│   ├── session.py         # AsyncEngine + sessions
│   └── base.py            # DeclarativeBase
├── agents/                # LangGraph state machines
└── modules/               # os 7 módulos do edital
    ├── ingestion/         # 1. ETL multifonte
    ├── crossing/          # 2. cruzamentos + grafo
    ├── ai/                # 3. score de risco + XAI
    ├── cases/             # 4. gestão de casos / autorregularização
    ├── analytics/         # 5. dashboards / relatórios
    ├── compliance/        # 6. RBAC, audit, LGPD
    └── support/           # 7. copilot fiscal, simulador

alembic/                   # migrations
tests/                     # pytest
```

Cada módulo seguirá o padrão abaixo quando for implementado (hoje as pastas contêm apenas `__init__.py` com a spec em docstring):

```text
modules/<nome>/
├── __init__.py
├── router.py              # FastAPI APIRouter
├── schemas.py             # Pydantic v2 (request/response)
├── service.py             # lógica de negócio
├── repository.py          # acesso a dados (SQLAlchemy)
└── models.py              # SQLAlchemy ORM
```

## Convenções

Veja [`../../AGENTS.md`](../../AGENTS.md) §4.2.

## Endpoint de saúde

```http
GET /health
```

Retorna `{"status":"ok","version":"0.1.0"}`. Usado pelo Replit (`Always On`) e por probes de Kubernetes/Cloud Run em produção.
