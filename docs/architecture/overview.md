# Visão Arquitetural — FiscoCheck AI

## Contexto

A solução é um **mecanismo de triagem fiscal inteligente** que opera 24/7 com agentes autônomos, mas mantém o auditor como decisor final (`human-in-the-loop`). Atende ao Edital CPSI — Município de Brusque/SC.

## Princípios

1. **Human-in-the-loop:** agentes recomendam, auditor decide. Toda ação efetiva é registrada com `auditor_id` + timestamp + correlation-id.
2. **Sigilo fiscal e LGPD desde a origem:** pseudonimização antes de qualquer treinamento ou envio a LLM externo.
3. **Cadeia de custódia auditável:** logs imutáveis (append-only) com correlation-id propagado de ponta a ponta.
4. **Explicabilidade:** todo score de risco vem com fatores explicativos.
5. **Parametrização pela Secretaria:** pesos e regras configuráveis sem refactor.
6. **Interoperabilidade:** conectores via API que aceitam novas fontes sem alterar o núcleo.

## Visão de alto nível

```mermaid
flowchart TB
    subgraph Fontes [Fontes externas]
        NFSe[NFS-e]
        DIMP[DIMP]
        ECD[ECD]
        DEFIS[DEFIS]
        PGDAS[PGDAS]
        Cadastro[Cadastro mobiliário]
        Abertos[Dados abertos]
    end

    subgraph Backend [apps/api FastAPI]
        subgraph Ingest [Módulo 1: Ingestão]
            Polars[Polars ETL]
            QA[Qualidade + pseudonimização]
        end
        subgraph Cross [Módulo 2: Cruzamento]
            Match[Matching declarado x NFS-e]
            Graph[GraphStore: NetworkX MVP / AGE fase 2]
        end
        subgraph AI [Módulo 3: IA Preditiva]
            Score[Score de risco]
            XAI[Explicabilidade]
            ALearning[Active Learning]
        end
        subgraph Cases [Módulo 4: Casos]
            Orch[Orquestrador LangGraph]
            Notify[Notificações multicanal]
        end
        subgraph Comp [Módulo 6: Compliance]
            RBAC[RBAC + MFA]
            Audit[Audit log imutável]
        end
    end

    subgraph DB [PostgreSQL 16]
        Relational[Relacional]
        Vector[pgvector]
        AGE["Apache AGE (fase 2)"]
    end

    subgraph Frontend [apps/web Next.js]
        Painel[Painel do auditor]
        Copilot[Copilot fiscal]
        Portal[Portal cidadão]
    end

    Cidadao[Cidadão] --> Portal
    Auditor[Auditor humano] --> Painel
    Painel <-->|HTTP/SSE| Backend
    Portal <-->|HTTP| Backend
    Fontes --> Polars
    Polars --> QA
    QA --> Relational
    Relational --> Match
    Match --> Graph
    Graph -.->|"fase 2 (nuvem nacional)"| AGE
    Match --> Score
    Score --> XAI
    XAI --> Orch
    Orch --> Notify
    Notify --> Cidadao
    Backend -.->|tudo passa por| Comp
    Comp --> Audit
```

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + TS + Tailwind v4 + shadcn/ui |
| Estado | Zustand (UI) + TanStack Query v5 (servidor) |
| Backend | FastAPI + Python 3.12 (async) |
| ORM | SQLAlchemy 2.0 + Alembic |
| ETL | Polars + PyArrow |
| Agentes | LangGraph |
| ML | scikit-learn + NetworkX |
| Banco | PostgreSQL 16 + pgvector (Apache AGE adiado — ver [ADR-0002](../adr/0002-database-mvp-replit.md)) |
| Cache/fila | Redis 7 |
| Lint/format | Biome (web) + Ruff (api) |
| Typecheck | tsc + Pyright |
| Testes | Vitest + pytest |

Detalhes e justificativas em [`../adr/0001-stack-inicial.md`](../adr/0001-stack-inicial.md).

## Fluxo típico (caso fiscal)

```mermaid
sequenceDiagram
    actor Cidadao
    participant Fontes as Fontes
    participant Ingest as Agente Ingestão
    participant Cross as Agente Gatekeeper
    participant AI as Score IA
    participant Auditor as Auditor
    participant Orch as Orquestrador
    participant Audit as Audit Log

    Fontes->>Ingest: nova carga (NFS-e, DIMP, ...)
    Ingest->>Ingest: ETL + validação + pseudonimização
    Ingest->>Cross: dados confiáveis disponíveis
    Cross->>Cross: cruzamento + graph analytics
    Cross->>AI: caso candidato com evidências
    AI->>AI: score + fatores XAI
    AI->>Auditor: caso priorizado (UI)
    Auditor->>Orch: confirma ação (intimação)
    Orch->>Audit: registra decisão (append-only)
    Orch->>Cidadao: notifica (e-mail/SMS/WhatsApp)
    Cidadao->>Orch: autorregulariza ou contesta
    Orch->>Auditor: devolve resposta no fluxo
```

## Decisões pendentes (registrar como ADRs)

- Provedor de **identidade** (gov.br / Keycloak / Azure AD do município).
- Provedor de **notificações** (Resend / Twilio / Meta WhatsApp Business).
- **Hosting de produção** (AWS São Paulo / Azure Brazil South / nuvem TCE-SC).
- **Observabilidade** (Sentry + OpenTelemetry → qual coletor?).
- **Engine de regras** parametrizáveis (DSL própria? Drools? Conditional Logic em SQL?).

Veja [`../adr/`](../adr/) à medida que forem decididas.
