"""Módulo 2 — Cruzamento e Detecção de Inconsistências.

Responsabilidades:
- Confronto sistemático entre o declarado e o emitido em NFS-e.
- Identificação de informais, subdeclarantes e inativos com atividade.
- Non-filer discovery via NFS-e de terceiros, meios de pagamento e
  fontes abertas.
- Graph analytics + resolução de entidades (sócios, endereços,
  operações).
- Monitoramento contínuo (CTC) em quase tempo real sobre NFS-e.

Stack interna alvo: SQLAlchemy + NetworkX in-memory no MVP (Apache AGE
adiado para a migração à nuvem nacional — ver ADR-0002); Polars entra
com o módulo 1 (ingestão). As libs Polars/NetworkX/AGE não estão
instaladas ainda no `pyproject.toml`; entram junto com a implementação.
"""
