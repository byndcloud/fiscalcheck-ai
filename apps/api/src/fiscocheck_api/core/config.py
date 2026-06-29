"""Configuração tipada via Pydantic Settings.

Lê valores do `.env` (e do ambiente) com validação. Valores secretos
nunca devem ter default real; o default visível serve apenas para o app
subir em ambiente local de scaffolding.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração da aplicação.

    A LGPD e o sigilo fiscal exigem que segredos venham SEMPRE de
    variáveis de ambiente (Replit Secrets em piloto, cofre da nuvem
    em produção).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "staging", "production", "test"] = (
        "development"
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/fiscocheck"
    )
    database_url_sync: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/fiscocheck"
    )
    database_url_test: str | None = None

    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: SecretStr = SecretStr("change-me-use-openssl-rand-hex-32")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 30
    jwt_refresh_token_expires_days: int = 14

    cors_allow_origins: str = "http://localhost:3000"

    pseudonymization_salt: SecretStr = SecretStr(
        "change-me-distinct-from-jwt-secret",
    )
    audit_log_retention_days: int = Field(default=1825, ge=365)

    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "fiscocheck-ai-dev"
    langsmith_tracing: bool = False

    sentry_dsn: str | None = None
    otel_exporter_otlp_endpoint: str | None = None

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Retorna o singleton de configuração."""
    return Settings()
