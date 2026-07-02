"""Os 7 módulos do edital CPSI Brusque/SC.

Cada subpasta segue o padrão:
    router.py   — APIRouter FastAPI
    schemas.py  — Pydantic v2 (request/response)
    service.py  — lógica de negócio
    repository.py — acesso a dados (SQLAlchemy)
    models.py   — ORM (SQLAlchemy 2.0)

Mapa:
    ingestion/   — Módulo 1: ETL multifonte + qualidade
    crossing/    — Módulo 2: cruzamentos + graph analytics
    ai/          — Módulo 3: score de risco + explicabilidade
    cases/       — Módulo 4: gestão de fiscalização + autorregularização
    analytics/   — Módulo 5: dashboards + relatórios gerenciais
    compliance/  — Módulo 6: RBAC, audit logs, LGPD
    support/     — Módulo 7: copilot fiscal, simulador, geofiscalização
"""
