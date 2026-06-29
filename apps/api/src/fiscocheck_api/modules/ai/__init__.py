"""Módulo 3 — Inteligência Artificial e Análise Preditiva.

Responsabilidades:
- Score de risco do contribuinte (IA preditiva sobre histórico).
- Scoring de risco de redes (topologia: centralidade, comunidades
  suspeitas, ligações com autuados).
- Critérios e pesos parametrizáveis pela Secretaria (sem refactor).
- Explicabilidade (XAI) — fatores que justificam cada classificação.
- Active learning: cada validação/reclassificação do auditor
  realimenta retrain + calibragem.

Stack interna: scikit-learn, NetworkX, SHAP (a adicionar quando
o modelo concreto entrar), LangGraph (agente de calibragem).
"""
