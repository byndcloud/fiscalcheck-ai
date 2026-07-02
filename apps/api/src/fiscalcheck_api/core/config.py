"""Configuração tipada via Pydantic Settings.

Lê valores do `.env` (e do ambiente) com validação. Valores secretos
nunca devem ter default real; o default visível serve apenas para o app
subir em ambiente local de scaffolding. Em `staging`/`production` o
boot falha rápido se algum desses placeholders ainda estiver presente
(ver `_refuse_placeholders_outside_dev`).
"""

from functools import lru_cache
from typing import Final, Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

JWT_SECRET_PLACEHOLDER: Final = "change-me-use-openssl-rand-hex-32"  # noqa: S105
PSEUDONYM_SALT_PLACEHOLDER: Final = "change-me-distinct-from-jwt-secret"


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

    environment: Literal["development", "staging", "production", "test"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fiscalcheck"
    database_url_sync: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fiscalcheck"
    database_url_test: str | None = None

    jwt_secret: SecretStr = SecretStr(JWT_SECRET_PLACEHOLDER)
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 30
    jwt_refresh_token_expires_days: int = 14

    cors_allow_origins: str = "http://localhost:3000"

    pseudonymization_salt: SecretStr = SecretStr(PSEUDONYM_SALT_PLACEHOLDER)
    audit_log_retention_days: int = Field(default=1825, ge=365)

    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None
    langsmith_api_key: SecretStr | None = None
    langsmith_project: str = "fiscalcheck-ai-dev"
    langsmith_tracing: bool = False

    sentry_dsn: str | None = None
    otel_exporter_otlp_endpoint: str | None = None

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def _refuse_placeholders_outside_dev(self) -> "Settings":
        """Falha rápido se segredos placeholder vazarem para staging/produção.

        Defaults com `change-me-*` só fazem sentido em ambiente de scaffolding
        local. Em qualquer outro contexto, exigimos valores reais via Secrets
        (Replit) ou cofre da nuvem.
        """
        if self.environment not in {"staging", "production"}:
            return self

        invalid: list[str] = []
        if self.jwt_secret.get_secret_value() == JWT_SECRET_PLACEHOLDER:
            invalid.append("JWT_SECRET")
        if self.pseudonymization_salt.get_secret_value() == PSEUDONYM_SALT_PLACEHOLDER:
            invalid.append("PSEUDONYMIZATION_SALT")

        if invalid:
            joined = ", ".join(invalid)
            msg = (
                f"Segredos placeholder detectados em environment={self.environment}: "
                f"{joined}. Defina valores reais via Secrets antes de subir o app."
            )
            raise ValueError(msg)
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Retorna o singleton de configuração."""
    return Settings()
