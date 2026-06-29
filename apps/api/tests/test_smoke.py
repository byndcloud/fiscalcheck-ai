"""Smoke tests: garantem que o app sobe e os helpers básicos funcionam."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from fiscocheck_api.core.security import pseudonymize


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
