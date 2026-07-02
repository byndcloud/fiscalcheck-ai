"""Logging estruturado com correlation-id.

A cadeia de custódia exigida pelo edital depende de logs com identidade
estável por requisição. O `X-Correlation-Id` é gerado/aceito do header
da requisição e propagado em todos os logs emitidos pelo handler.
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import TYPE_CHECKING, Final

import structlog
from starlette.middleware.base import BaseHTTPMiddleware

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from starlette.requests import Request
    from starlette.responses import Response
    from structlog.types import EventDict, WrappedLogger

_correlation_id_var: ContextVar[str | None] = ContextVar(
    "correlation_id",
    default=None,
)

CORRELATION_ID_HEADER: Final[str] = "X-Correlation-Id"
MAX_CORRELATION_ID_LENGTH: Final[int] = 128


def _add_correlation_id(
    _: WrappedLogger,
    __: str,
    event_dict: EventDict,
) -> EventDict:
    cid = _correlation_id_var.get()
    if cid is not None:
        event_dict["correlation_id"] = cid
    return event_dict


def configure_logging(level: str = "INFO") -> None:
    """Configura structlog + stdlib logging para JSON estruturado."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper(), logging.INFO),
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            _add_correlation_id,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level.upper(), logging.INFO),
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Retorna um logger estruturado nomeado."""
    return structlog.get_logger(name)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Middleware que garante um correlation-id por requisição.

    - Reusa o header `X-Correlation-Id` do cliente (se válido), ou gera
      um novo UUIDv4.
    - Disponibiliza em `request.state.correlation_id`.
    - Adiciona o header na resposta.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        incoming = request.headers.get(CORRELATION_ID_HEADER)
        cid = (
            incoming
            if incoming and len(incoming) <= MAX_CORRELATION_ID_LENGTH
            else str(uuid.uuid4())
        )

        token = _correlation_id_var.set(cid)
        request.state.correlation_id = cid
        try:
            response = await call_next(request)
        finally:
            _correlation_id_var.reset(token)
        response.headers[CORRELATION_ID_HEADER] = cid
        return response
