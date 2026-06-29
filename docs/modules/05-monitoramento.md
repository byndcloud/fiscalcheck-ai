# Módulo 5 — Monitoramento Estratégico e Relatórios

> Visão gerencial, indicadores de desempenho e acompanhamento das metas.
> Pasta: `apps/api/src/fiscocheck_api/modules/analytics/`.

## Objetivo (do edital)

> Disponibilizar dashboards gerenciais em tempo real, alertas inteligentes e relatórios para tomada de decisão e prestação de contas.

## Funcionalidades-chave

- **Dashboards gerenciais** — casos abertos, valores recuperados, valores potenciais, produtividade, divergências críticas.
- **Alertas inteligentes** — disparados quando KPIs caem fora de banda.
- **Agente de relatórios** — atualiza painéis, gera insights, alerta sobre progresso das metas (acurácia, escala, usabilidade).
- **Relatórios gerenciais** — subsídio para planejamento e prestação de contas.

## Arquitetura interna

```
modules/analytics/
├── router.py
├── service.py
├── schemas.py
├── queries/             # SQL otimizado por KPI
│   ├── casos.sql
│   ├── valores.sql
│   ├── produtividade.sql
│   └── alertas.sql
├── materialized_views/  # MVs no Postgres (refresh agendado)
├── reports/             # gerador de relatórios (PDF / CSV)
└── agent/               # agente de relatórios em agents/reporter/
```

## Dependências entre módulos

- **Entrada:** dados de todos os módulos 1–4.
- **Saída:** KPIs para painel do auditor (web) e relatórios para gestão.
- **Compliance:** RBAC do módulo 6 limita visão por papel.

## Métricas / SLA

- **Atualização** dos KPIs: até 5 min de defasagem (materialized views com refresh incremental).
- **Disponibilidade** do dashboard: ≥ 99,5% (piloto).
- **Tempo de geração** de relatório gerencial: ≤ 30s para até 12 meses de dados.

## Decisões pendentes

- **Materialized views** vs **agregações em batch** vs **TimescaleDB**?
- **PDF**: Puppeteer no web ou WeasyPrint no api?
- **Exportação CSV**: streaming via FastAPI?
- **Embed** de painéis em outras ferramentas (Grafana? Metabase?) ou tudo nativo no Next.js?
