"""Helpers de segurança: hashing de senha, JWT, pseudonimização.

Os helpers aqui são placeholders prontos para uso, mas o ciclo
completo de autenticação (login/refresh/logout, MFA enrol/verify,
RBAC com escopos) será implementado em `modules/compliance/auth/`
em sprint dedicado.
"""

from __future__ import annotations

import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from fiscalcheck_api.core.config import get_settings


def hash_password(plain: str) -> str:
    """Faz hash bcrypt da senha em texto puro."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica senha contra hash.

    Hash malformado/corrompido conta como falha de autenticação
    (`False`), não como erro 500 — `bcrypt.checkpw` lança `ValueError`
    quando o salt do hash armazenado é inválido.
    """
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Cria JWT de acesso curto.

    `subject` deve ser o `user_id` (auditor autenticado).
    """
    settings = get_settings()
    now = datetime.now(tz=UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.jwt_access_token_expires_minutes))
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(
        payload,
        settings.jwt_secret.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica e valida JWT (assinatura + expiração)."""
    settings = get_settings()
    return jwt.decode(
        token,
        settings.jwt_secret.get_secret_value(),
        algorithms=[settings.jwt_algorithm],
    )


def pseudonymize(value: str) -> str:
    """Hash determinístico com salt para anonimizar identificadores.

    Aplicado a CPF/CNPJ antes de qualquer envio a LLMs externos e
    antes do treinamento de modelos (requisito LGPD).
    """
    settings = get_settings()
    salt = settings.pseudonymization_salt.get_secret_value().encode()
    digest = hmac.new(salt, value.encode("utf-8"), hashlib.sha256)
    return digest.hexdigest()
