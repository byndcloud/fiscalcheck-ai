"""Módulo 2 — Cruzamento e Detecção de Inconsistências.

Responsabilidades:
- Confronto sistemático entre o declarado e o emitido em NFS-e.
- Identificação de informais, subdeclarantes e inativos com atividade.
- Non-filer discovery via NFS-e de terceiros, meios de pagamento e
  fontes abertas.
- Graph analytics + resolução de entidades (sócios, endereços,
  operações) — base do Apache AGE.
- Monitoramento contínuo (CTC) em quase tempo real sobre NFS-e.

Stack interna: SQLAlchemy, Apache AGE, NetworkX, Polars.
"""
