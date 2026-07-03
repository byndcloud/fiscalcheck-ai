"""Smoke tests: garantem que o app sobe e os helpers básicos funcionam."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from pydantic import SecretStr, ValidationError

from fiscalcheck_api.core.config import (
    JWT_SECRET_PLACEHOLDER,
    PSEUDONYM_SALT_PLACEHOLDER,
    Settings,
)
from fiscalcheck_api.core.security import (
    hash_password,
    pseudonymize,
    verify_password,
)

if TYPE_CHECKING:
    from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body


@pytest.mark.asyncio
async def test_correlation_id_propagated(client: AsyncClient) -> None:
    response = await client.get(
        "/health",
        headers={"X-Correlation-Id": "fixed-id-for-test"},
    )
    assert response.status_code == 200
    assert response.headers["X-Correlation-Id"] == "fixed-id-for-test"


@pytest.mark.asyncio
async def test_correlation_id_generated(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    cid = response.headers.get("X-Correlation-Id")
    assert cid is not None
    assert len(cid) > 0


def test_pseudonymize_is_deterministic() -> None:
    """Mesmo valor com mesmo salt produz mesmo hash (idempotente)."""
    a = pseudonymize("12345678900")
    b = pseudonymize("12345678900")
    assert a == b
    assert len(a) == 64
    assert a != "12345678900"


def test_pseudonymize_diverges_for_different_values() -> None:
    assert pseudonymize("12345678900") != pseudonymize("12345678901")


def test_verify_password_roundtrip() -> None:
    hashed = hash_password("senha-forte-123")
    assert verify_password("senha-forte-123", hashed)
    assert not verify_password("senha-errada", hashed)


def test_verify_password_malformed_hash_is_auth_failure() -> None:
    """Hash corrompido no banco vira False, não ValueError/500 no login."""
    assert not verify_password("qualquer-senha", "nao-e-um-hash-bcrypt")
    assert not verify_password("qualquer-senha", "")


def test_settings_allows_placeholders_in_development() -> None:
    """Em dev local o app precisa subir sem Secrets — placeholders são tolerados."""
    settings = Settings(
        environment="development",
        jwt_secret=SecretStr(JWT_SECRET_PLACEHOLDER),
        pseudonymization_salt=SecretStr(PSEUDONYM_SALT_PLACEHOLDER),
    )
    assert settings.environment == "development"


def test_settings_refuses_jwt_placeholder_in_production() -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(
            environment="production",
            jwt_secret=SecretStr(JWT_SECRET_PLACEHOLDER),
            pseudonymization_salt=SecretStr("real-salt-not-placeholder"),
        )


def test_settings_refuses_salt_placeholder_in_staging() -> None:
    with pytest.raises(ValidationError, match="PSEUDONYMIZATION_SALT"):
        Settings(
            environment="staging",
            jwt_secret=SecretStr("real-jwt-secret-not-placeholder"),
            pseudonymization_salt=SecretStr(PSEUDONYM_SALT_PLACEHOLDER),
        )
