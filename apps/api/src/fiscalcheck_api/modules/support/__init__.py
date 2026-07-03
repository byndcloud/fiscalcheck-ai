"""Módulo 7 — Suporte, Capacitação e Funcionalidades Adicionais.

Responsabilidades:
- Suporte técnico com SLA + capacitação (5 treinamentos previstos
  no edital) + transferência de conhecimento.
- Ambiente de simulação com dados históricos anonimizados para
  treinamento prático de novos auditores.
- Copilot Fiscal: assistente conversacional sobre legislação
  tributária municipal, critérios de risco e histórico do
  contribuinte (RAG sobre pgvector).
- Geofiscalização (visão computacional + APIs de mapas) para apoio
  à fiscalização da construção civil.
- Manutenção evolutiva para mudanças normativas.

Stack interna: LangGraph (copilot), pgvector (embeddings),
sentence-transformers (a adicionar quando o copilot entrar).
"""
