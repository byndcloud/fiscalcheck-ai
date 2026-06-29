"""Módulo 6 — Segurança, Governança e Conformidade.

ATUAÇÃO TRANSVERSAL a todos os módulos.

Responsabilidades:
- Agente Guardrail (RBAC, sigilo fiscal, logs imutáveis, detecção
  de acessos atípicos).
- Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256).
- MFA obrigatório para papéis privilegiados.
- Segregação de dados por papel.
- Cadeia de custódia (logs append-only com timestamp + correlation-id +
  auditor_id).
- Conformidade LGPD: pseudonimização, RIPD, ROPA, retenção, resposta
  a incidente ≤ 24h, preferência por localização nacional.
- Estrita observância ao art. 198 do CTN (sigilo fiscal).

NÃO MODIFICAR sem revisão da skill `security-auditor`.
"""
