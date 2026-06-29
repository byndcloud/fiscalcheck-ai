# 01 — Estrutura de módulos do `apps/api`

Cada um dos 7 módulos do edital vira uma subpasta em [`apps/api/src/fiscocheck_api/modules/`](../../../../apps/api/src/fiscocheck_api/modules/). Padrão obrigatório para coesão e revisão.

---

## 1. Layout padrão por módulo

```
modules/<nome>/
├── __init__.py          # exporta o router (e nada mais)
├── router.py            # endpoints FastAPI (HTTP/SSE)
├── schemas.py           # Pydantic v2 — request/response
├── service.py           # regras de negócio (puras quando possível)
├── repository.py        # acesso a dados (SQLAlchemy 2.0 async)
├── models.py            # ORM (Mapped[]/mapped_column)
└── (opcional)
    ├── tasks.py         # jobs Celery/Arq/APScheduler
    ├── graph.py         # acesso ao grafo (NetworkX no MVP)
    └── exceptions.py    # exceções de domínio
```

Camadas separadas porque:

- **`router.py`** só conhece HTTP — autenticação, validação Pydantic, conversão de exceção em response. Não chama ORM.
- **`service.py`** é a camada testável: recebe schemas Pydantic + dependências (repositório, clientes), retorna schemas ou levanta exceções de domínio.
- **`repository.py`** isola SQL. Permite trocar implementação sem mexer no service (útil para o `GraphStore` do módulo 2).
- **`models.py`** define o esquema relacional. Toda alteração aqui exige migration nova.

## 2. Esqueleto mínimo (copiar e adaptar)

### `__init__.py`

```python
from fiscocheck_api.modules.<nome>.router import router

__all__ = ["router"]
```

### `schemas.py`

```python
"""Schemas Pydantic v2 do módulo <nome>."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CaseCreate(BaseModel):
    """Payload de criação de caso fiscal.

    Origem: requisito FA04 do edital (abertura de fiscalização).
    """

    model_config = ConfigDict(extra="forbid")

    taxpayer_id: UUID = Field(description="ID interno do contribuinte (não-PII)")
    risk_score: float = Field(ge=0.0, le=1.0)
    justification: str = Field(min_length=10, max_length=2000)


class CaseRead(BaseModel):
    id: UUID
    taxpayer_id: UUID
    risk_score: float
    created_at: datetime
    created_by_auditor_id: UUID
```

### `models.py`

```python
"""Modelos SQLAlchemy 2.0 do módulo <nome>."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from fiscocheck_api.db.base import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    taxpayer_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    risk_score: Mapped[float] = mapped_column(nullable=False)
    justification: Mapped[str] = mapped_column(String(2000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(tz=UTC),
        nullable=False,
    )
    created_by_auditor_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("auditors.id"),
        nullable=False,
    )
```

### `repository.py`

```python
"""Acesso a dados do módulo <nome>."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fiscocheck_api.modules.<nome>.models import Case


class CaseRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, case_id: uuid.UUID) -> Case | None:
        result = await self._session.execute(
            select(Case).where(Case.id == case_id),
        )
        return result.scalar_one_or_none()

    async def add(self, case: Case) -> Case:
        self._session.add(case)
        await self._session.flush()
        return case
```

### `service.py`

```python
"""Regras de negócio do módulo <nome>."""

import uuid

from fiscocheck_api.core.logging import get_logger
from fiscocheck_api.modules.<nome>.models import Case
from fiscocheck_api.modules.<nome>.repository import CaseRepository
from fiscocheck_api.modules.<nome>.schemas import CaseCreate, CaseRead

logger = get_logger(__name__)


class CaseService:
    def __init__(self, repo: CaseRepository) -> None:
        self._repo = repo

    async def create_case(
        self,
        payload: CaseCreate,
        auditor_id: uuid.UUID,
    ) -> CaseRead:
        """Cria caso fiscal após decisão do auditor.

        Requisito FA04: abertura de fiscalização exige auditor autenticado
        e justificativa registrada (cadeia de custódia).
        """
        case = Case(
            taxpayer_id=payload.taxpayer_id,
            risk_score=payload.risk_score,
            justification=payload.justification,
            created_by_auditor_id=auditor_id,
        )
        case = await self._repo.add(case)
        logger.info(
            "case_created",
            case_id=str(case.id),
            taxpayer_id=str(case.taxpayer_id),  # ID interno, não-PII
            auditor_id=str(auditor_id),
        )
        return CaseRead.model_validate(case, from_attributes=True)
```

### `router.py`

```python
"""Endpoints HTTP do módulo <nome>."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from fiscocheck_api.db.session import get_db_session
from fiscocheck_api.modules.<nome>.repository import CaseRepository
from fiscocheck_api.modules.<nome>.schemas import CaseCreate, CaseRead
from fiscocheck_api.modules.<nome>.service import CaseService

# TODO(sprint-auth): substituir por dependência real de auth (modules/compliance).
from fiscocheck_api.auth.placeholder import get_current_auditor  # pseudo-código

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post(
    "",
    response_model=CaseRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_case(
    payload: CaseCreate,
    auditor=Depends(get_current_auditor),
    session=Depends(get_db_session),
) -> CaseRead:
    service = CaseService(CaseRepository(session))
    try:
        return await service.create_case(payload, auditor_id=auditor.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INVALID_CASE", "message": str(exc)},
        ) from exc
```

## 3. Registrar o router em `main.py`

```python
# apps/api/src/fiscocheck_api/main.py
from fiscocheck_api.modules.cases.router import router as cases_router

def create_app() -> FastAPI:
    app = FastAPI(...)
    # ...middlewares...
    app.include_router(cases_router, prefix="/api/v1")
    return app
```

Padronize **`/api/v1`** como prefix de todos os módulos para versionamento.

## 4. Dependências canônicas

Use FastAPI `Depends` para injetar:

- `session: AsyncSession = Depends(get_db_session)` — de [`db/session.py`](../../../../apps/api/src/fiscocheck_api/db/session.py).
- `auditor = Depends(get_current_auditor)` — virá do módulo 6. Não invente outra; espere ou contribua para a implementação.
- Repositório e service são instanciados no `router.py` recebendo o `session`. Não use `Depends` para essas camadas (overkill).

## 5. Erros e respostas

Padrão de payload de erro (consumido por [`apps/web/lib/api-client.ts`](../../../../apps/web/lib/api-client.ts)):

```json
{
  "error_code": "INVALID_CASE",
  "detail": "Justificativa precisa ter pelo menos 10 caracteres.",
  "correlation_id": "<uuid>"
}
```

- `error_code` é string estável (UPPER_SNAKE_CASE) — vire um `Enum` ou módulo `errors.py` quando crescer.
- `detail` em pt-BR.
- `correlation_id` vem do header de resposta (`X-Correlation-Id`) que o middleware já preenche — não precisa repetir no body.

## 6. Anti-padrões

- ❌ `router.py` que faz `await session.execute(select(...))` direto — pula a camada de repository.
- ❌ `service.py` que recebe `Request` do FastAPI — service deve ser independente de HTTP.
- ❌ Schemas duplicados (`CreateCaseRequest` e `CaseCreatePayload`). Um nome canônico por intenção.
- ❌ Modelos com `default=datetime.utcnow` — naive. Use `default=lambda: datetime.now(tz=UTC)` (Ruff `DTZ` reclama).
- ❌ Repositório que retorna ORM model **para fora do módulo** — converta para schema antes (a borda do módulo é o service).
