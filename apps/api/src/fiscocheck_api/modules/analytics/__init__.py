"""Módulo 5 — Monitoramento Estratégico e Relatórios.

Responsabilidades:
- Dashboards gerenciais em tempo real (casos abertos, valores
  recuperados, potenciais, produtividade, divergências críticas).
- Alertas inteligentes automáticos.
- Agente de relatórios que atualiza painéis, gera insights e
  dispara alertas sobre metas de acurácia, ganho de escala e
  usabilidade.
- Relatórios gerenciais para tomada de decisão e prestação de contas.

Stack interna: queries materializadas no Postgres + endpoints
de leitura otimizados; agregações com Polars onde fizer sentido.
"""
