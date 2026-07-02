"""Módulo 1 — Integração, Ingestão e Qualidade de Dados.

Responsabilidades:
- ETL multifonte (NFS-e, DIMP, ECD, DEFIS, PGDAS, PGDAS-D, cadastro
  mobiliário, dados abertos).
- Validação de esquema e qualidade.
- Pseudonimização (LGPD) antes de qualquer treinamento ou envio a LLM.
- Agente 24/7 que monitora novas cargas e sinaliza falhas.
- Escalabilidade horizontal (Polars + particionamento).

Stack interna: Polars, PyArrow, httpx (APIs), SQLAlchemy (staging).
"""
