"""Aplicação FastAPI do FiscoCheck AI.

Ponto de entrada do backend. Configura:
- Middleware de CORS (somente origens permitidas via env).
- Middleware de correlation-id (cadeia de custódia — requisito do edital).
- Logging estruturado (structlog).
- Endpoint /health (probes do Replit Always On).
- Inclusão de routers dos 7 módulos (placeholders nesta etapa).
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fiscocheck_api import __version__
from fiscocheck_api.core.config import get_settings
from fiscocheck_api.core.logging import (
    CorrelationIdMiddleware,
    configure_logging,
    get_logger,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Inicializações e desligamento ordenado do app."""
    settings = get_settings()
    configure_logging(level=settings.log_level)
    logger = get_logger(__name__)
    logger.info(
        "api_starting",
        environment=settings.environment,
        version=__version__,
    )
    yield
    logger.info("api_stopping")


def create_app() -> FastAPI:
    """Factory do app FastAPI (também usada nos testes)."""
    settings = get_settings()
    app = FastAPI(
        title="FiscoCheck AI — API",
        description=(
            "Plataforma de Inteligência Fiscal Agêntica. "
            "Toda ação com efeito sobre o contribuinte exige auditor "
            "autenticado (RBAC) e respeita o sigilo fiscal "
            "(art. 198 do CTN) e a LGPD."
        ),
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Correlation-Id"],
    )

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.get("/", tags=["health"])
    async def root() -> dict[str, str]:
        return {
            "name": "FiscoCheck AI — API",
            "version": __version__,
            "docs": "/docs",
        }

    return app


app = create_app()
