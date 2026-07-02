"""Base declarativa do SQLAlchemy 2.0 (estilo `Mapped[]`).

Toda model deve herdar de `Base` para participar das migrations
geradas pelo Alembic.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base de todas as models do FiscalCheck AI."""
