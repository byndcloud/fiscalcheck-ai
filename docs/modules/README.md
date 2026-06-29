# Módulos da Plataforma

Os 7 módulos do edital, com link para cada especificação detalhada.

| # | Módulo | Foco | Pasta backend |
|---|---|---|---|
| 1 | [Integração, Ingestão e Qualidade de Dados](./01-ingestao.md) | ETL multifonte, qualidade, agente 24/7 | `modules/ingestion/` |
| 2 | [Cruzamento e Detecção de Inconsistências](./02-cruzamento.md) | Declarado x NFS-e, grafo, CTC | `modules/crossing/` |
| 3 | [IA e Análise Preditiva](./03-ia-preditiva.md) | Score de risco, XAI, active learning | `modules/ai/` |
| 4 | [Gestão da Fiscalização e Autorregularização](./04-gestao-fiscalizacao.md) | Orquestrador, dossiê, multicanal | `modules/cases/` |
| 5 | [Monitoramento Estratégico e Relatórios](./05-monitoramento.md) | Dashboards, alertas, KPIs | `modules/analytics/` |
| 6 | [Segurança, Governança e Conformidade](./06-seguranca-governanca.md) | RBAC, MFA, audit, LGPD | `modules/compliance/` |
| 7 | [Suporte, Capacitação e Funcionalidades Adicionais](./07-suporte-capacitacao.md) | Copilot, simulador, geofiscalização | `modules/support/` |

Cada documento segue o template:

1. **Objetivo** (do edital)
2. **Funcionalidades-chave**
3. **Arquitetura interna**
4. **Dependências entre módulos**
5. **Métricas / SLA**
6. **Decisões pendentes**

> A implementação concreta de cada módulo virá em sprints dedicados. Estes documentos são a fonte de verdade do **escopo** e devem ser atualizados antes do código.
