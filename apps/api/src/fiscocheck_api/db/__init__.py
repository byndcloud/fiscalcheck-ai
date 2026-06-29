"""Camada de banco de dados: engine, sessions, base declarativa."""

from fiscocheck_api.db.base import Base
from fiscocheck_api.db.session import get_db_session

__all__ = ["Base", "get_db_session"]
