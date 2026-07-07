# Módulo 5 — Monitoramento Estratégico e Relatórios

> Visão gerencial, indicadores de desempenho e acompanhamento das metas.
> Pasta: `apps/api/src/fiscalcheck_api/modules/analytics/`.

## Objetivo (do edital)

> Disponibilizar dashboards gerenciais em tempo real, alertas inteligentes e relatórios para tomada de decisão e prestação de contas.

## Funcionalidades-chave

- **Dashboards gerenciais** — casos abertos, valores recuperados, valores potenciais, produtividade, divergências críticas.
- **Alertas inteligentes** — disparados quando KPIs caem fora de banda.
- **Agente de relatórios** — atualiza painéis, gera insights, alerta sobre progresso das metas (acurácia, escala, usabilidade).
- **Relatórios gerenciais** — subsídio para planejamento e prestação de contas.

## Entrega T17 · Painel do Gestor (MVP web)

Rota `/analytics` no `apps/web`, restrita a `supervisor` + `admin`. Estende a implementação inicial (KPIs simples) para virar o **Painel do Gestor** completo do módulo 5.

- **KPIs em tempo real** (7): casos abertos, casos em análise, valor recuperado, potencial recuperável, produtividade auditor, divergências críticas, autorregularização — cada um com sparkline (12 pontos) e drill-down para `/cases`.
- **Metas do piloto (RF05)**: acurácia 70%, ganho de escala 100%, usabilidade 80%. Card de meta mostra baseline × atual × alvo + status (`no_alvo` / `em_risco` / `critico`). A regra determinística vive em [`apps/web/lib/analytics/meta-status.ts`](../../apps/web/lib/analytics/meta-status.ts).
- **Metodologia de aferição (TR 7.2)**: cada card traz o bloco colapsável "Como é aferida · TR 7.2.x" com a fórmula oficial e o método de coleta (`MetaAfericaoTR` no schema) — acurácia por subamostra auditada, ganho de capacidade vs. baseline formalizado e SUS aplicado in-app nos últimos 15 dias do piloto.
- **Captura SUS**: modal com as 10 perguntas do System Usability Scale (Brooke, 1996). O score alimenta a meta de usabilidade — cálculo puro em [`apps/web/lib/analytics/sus.ts`](../../apps/web/lib/analytics/sus.ts).
- **Gráficos interativos** com `recharts` ([ADR-0005](../adr/0005-recharts.md)): AreaChart de recuperação mensal e PieChart de status de casos.
- **Gerador de relatórios** (`ReportGeneratorModal`): Calibragem / Validação em PDF (`@react-pdf/renderer`) ou XLSX (SheetJS via dynamic import — [ADR-0006](../adr/0006-xlsx-sheetjs.md)). Cada emissão registra evento append-only na trilha via `POST /analytics/reports/generate`.
- **Alertas automáticos**: regra determinística no handler MSW empurra `Notificacao` com `origem: "auto_meta"` no sino sempre que uma meta transita para `em_risco`/`critico` — categoriza a origem sem quebrar consumidores existentes.

Endpoints MSW novos (todos em [`apps/web/mocks/handlers.ts`](../../apps/web/mocks/handlers.ts)):

- `GET /analytics/panel-manager-kpis?periodo=30d|90d|trimestre|ano`
- `GET /analytics/metas` · `POST /analytics/metas/:id/sus`
- `GET /analytics/sus`
- `POST /analytics/reports/generate` (RBAC: `supervisor` ou `admin`)

## Arquitetura interna

```text
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
