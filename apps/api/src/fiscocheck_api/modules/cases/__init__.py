"""Módulo 4 — Gestão da Fiscalização e Autorregularização.

Responsabilidades:
- Agente orquestrador que recomenda a próxima melhor ação por caso.
- Montagem automática de dossiê com evidências.
- Ação efetiva SÓ APÓS APROVAÇÃO do auditor (human-in-the-loop).
- Conformidade voluntária: notificação + caminho de autorregularização.
- Notificações eletrônicas com ciência formal e rastreabilidade.
- Canal multicanal (portal, e-mail, SMS, WhatsApp) com o cidadão.
- Gestão completa do caso (anotações, prazos, devolutivas).

Stack interna: LangGraph (orquestrador), Celery/Arq (notificações
assíncronas), provedores externos (a definir: Resend? Twilio?
Meta WhatsApp Business?).
"""
