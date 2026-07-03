"""Camada de banco de dados: engine, sessions, base declarativa."""

from fiscalcheck_api.db.base import Base
from fiscalcheck_api.db.session import get_db_session

__all__ = ["Base", "get_db_session"]
