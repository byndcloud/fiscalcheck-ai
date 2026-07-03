"""Agentes IA do FiscalCheck (LangGraph).

Cada agente é uma máquina de estado com `human-in-the-loop` nativo:
o LangGraph oferece nós de interrupção para aguardar decisão do
auditor antes de qualquer ação com efeito sobre o contribuinte.

Agentes planejados (placeholder):

- `ingestion/`         — Agente de Ingestão e Qualidade (módulo 1, 24/7)
- `gatekeeper/`        — Agente Gatekeeper de Cruzamento (módulo 2)
- `risk_scorer/`       — Calibragem de modelo (módulo 3, active learning)
- `orchestrator/`      — Orquestrador de Fiscalização (módulo 4)
- `reporter/`          — Agente de Relatórios (módulo 5)
- `guardrail/`         — Conformidade e Segurança (módulo 6, transversal)
- `copilot/`           — Copilot Fiscal (módulo 7, conversacional)
"""
