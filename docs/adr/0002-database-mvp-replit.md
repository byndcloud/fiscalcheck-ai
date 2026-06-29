# ADR-0002: Estratégia de banco para o MVP no Replit — pgvector sim, Apache AGE adiado

- **Status:** Accepted
- **Data:** 2026-06-29
- **Autor(es):** @owner-tech-lead
- **Revisores:** @owner-architect, @owner-backend
- **Relacionado:** [ADR-0001](./0001-stack-inicial.md) (superseded em parte — ver §"Relação com ADR-0001")

---

## Contexto

[ADR-0001](./0001-stack-inicial.md) definiu **PostgreSQL 16 + pgvector + Apache AGE** como banco único do FiscoCheck AI, hospedado no Replit durante o piloto e migrando para nuvem nacional em produção.

Ao validar a hospedagem do MVP no **Replit**, identificamos que:

- O **Replit Postgres** (gerenciado, backend Neon) **suporta `pgvector`** — pode ser ativado via `CREATE EXTENSION vector;`.
- O **Replit Postgres não suporta `Apache AGE`** — extensão não está disponível na imagem gerenciada e não há mecanismo para instalar extensões customizadas.

Manter `Apache AGE` como dependência hard do MVP exigiria:

- Rodar o Postgres dentro do mesmo Repl (container `apache/age:PG16_latest`), perdendo o gerenciamento automático (backup, escala, monitoramento) do serviço Replit.
- Ou pular o Replit como host de banco e ir direto para uma nuvem nacional — antecipando uma migração que ADR-0001 deliberadamente adiou para a produção.

O Módulo 2 (Cruzamento e Detecção de Inconsistências) é o único cliente direto de grafo. No piloto, o volume de entidades + arestas previsto cabe em memória (estimativa ~1M arestas; típico < 200 MB com NetworkX). Para os módulos 3 (IA preditiva) e 7 (Copilot RAG), o requisito ativo é `pgvector` — e este temos no Replit.

## Decisão

**No MVP hospedado em Replit, o banco é Postgres gerenciado do Replit + extensão `pgvector` apenas. Apache AGE é adiado para a migração à nuvem nacional.**

### Implicações concretas

1. **Módulo 2 — grafo no MVP**: implementado com **NetworkX in-memory** carregado a partir de tabelas relacionais (`entities`, `relationships`/`edges`) e reconstruído sob demanda. Quando o módulo for codificado, será introduzida a interface `GraphStore` em [`apps/api/src/fiscocheck_api/modules/crossing/graph/`](../../apps/api/src/fiscocheck_api/modules/crossing/graph/) com:
   - `NetworkXGraphStore` — implementação MVP.
   - `AgeGraphStore` — implementação fase 2, ativada quando migrar para a nuvem nacional.
   - A interface expõe operações idempotentes: `add_entity`, `add_relationship`, `find_common_neighbors`, `shortest_path`, `centrality_score`.

2. **Módulo 3 / Módulo 7**: usam `pgvector` para embeddings (RAG do Copilot e features do score). Sem mudança em relação a ADR-0001.

3. **Migrations Alembic**: a primeira migration habilita só `vector`, `uuid-ossp`, `pgcrypto`. Nada de `CREATE EXTENSION age`.

4. **`infra/docker-compose.yml`**: continua incluindo `apache/age:PG16_latest` como **opção de dev local** sob perfil `graph`, para quando o desenvolvedor quiser testar a implementação AGE em prep da fase 2.

5. **`replit.md`** e o init SQL refletem essa decisão.

### Quando AGE volta

Quando migrarmos para a nuvem nacional (AWS São Paulo / Azure Brazil South / nuvem TCE-SC — ADR futuro), a infra de banco terá controle de extensões e poderemos:

1. Habilitar `Apache AGE` via `CREATE EXTENSION age;`.
2. Trocar a implementação `GraphStore` registrada no DI container de `NetworkXGraphStore` para `AgeGraphStore`.
3. Migration de dados do grafo: ler a representação relacional (`entities` + `relationships`) e popular o grafo AGE (`SELECT create_graph(...); MATCH ...`).
4. Manter `NetworkXGraphStore` no código por 1 sprint pós-migração como fallback de segurança.

## Consequências

### Positivas

- Habilita o piloto no Replit sem fricção de auto-hospedagem do Postgres.
- Mantém backup/restore/monitoramento gerenciados do Replit no piloto.
- Postpõe a complexidade de operar AGE para depois do produto ter validado as hipóteses de mercado/uso.
- `GraphStore` como abstração já é boa prática — desacopla o módulo 2 do banco específico.

### Negativas / trade-offs

- **Escala do grafo limitada no MVP** a o que cabe em memória do worker FastAPI (estimativa: ~10M arestas com NetworkX otimizado; ~1M é confortável). Acima disso, performance degrada.
- **Reconstrução do grafo a cada cold start** — overhead na primeira request após reinício do Repl. Mitigação: warmup no `lifespan` ou cache leve em Redis (apenas estrutura, sem PII bruta — só hashes).
- **Operações de grafo limitadas** ao que NetworkX oferece. Cypher (do AGE) é mais expressivo. Mitigação: a interface `GraphStore` força operações primitivas suficientes; consultas exóticas (caminhos exatos, comunidades complexas) ficam para fase 2.

### Riscos

- **Saltar a complexidade do AGE no MVP pode esconder problemas de modelagem** que só aparecem no Cypher. Mitigação: revisão de design do Módulo 2 deve antecipar consultas que serão feitas em fase 2 e validar que `NetworkXGraphStore` consegue equivalente (mesmo que com performance menor).
- **Volume de PII** no Replit (gerenciado em US) — já documentado em ADR-0001 e [`replit.md`](../../replit.md) como aceito apenas para o piloto (dados sintéticos / pseudonimizados / volumes baixos). Não muda nesta ADR.

## Alternativas consideradas

### A. Auto-hospedar `apache/age:PG16_latest` dentro do próprio Repl

- **A favor**: mantém a stack original do ADR-0001 sem mudança.
- **Contra**: perde backup gerenciado, escala manual, conexão local; quando o Repl reinicia, o DB pode perder estado se não houver volume persistente. **Rejeitada** — viola o motivo de estar no Replit (operações simples).

### B. Pular Replit, ir direto para nuvem nacional gerenciada com extensões custom

- **A favor**: desbloqueia AGE.
- **Contra**: antecipa migração que o ADR-0001 explicitou adiar; custo + tempo de provisionamento de produção fora da janela do piloto. **Rejeitada** — para o piloto.

### C. Substituir AGE por Neo4j (separado) já no MVP

- **A favor**: maturidade do Neo4j.
- **Contra**: dois bancos no piloto + integração via driver Neo4j + nova ferramenta operacional + Neo4j AuraDB Free não atende LGPD/localização. **Rejeitada** — adiada como opção quando o grafo crescer (ADR futuro).

### D. Skipar o Módulo 2 inteiramente no MVP

- **A favor**: simplifica o escopo do piloto.
- **Contra**: cruzamento é uma das funções centrais do edital (RF02); pular descaracteriza o piloto. **Rejeitada**.

## Como reverter

- Trocar a implementação `GraphStore` injetada no DI por `AgeGraphStore`.
- Adicionar uma migration que habilita `CREATE EXTENSION age;` e cria `fisco_graph`.
- Migrar dados do `entities`/`relationships` para o grafo AGE (script one-off).
- Manter `NetworkXGraphStore` no código como fallback por 1 sprint.

## Relação com ADR-0001

Esta ADR **substitui parcialmente** a seção "Banco único: PostgreSQL 16 com extensões `pgvector` (embeddings/RAG) e `Apache AGE` (grafo)" de [ADR-0001](./0001-stack-inicial.md) durante a fase de piloto. O restante de ADR-0001 (Next.js 15, FastAPI, Polars, LangGraph, Redis, CI, monorepo) permanece inalterado.

ADR-0001 não foi editado — esta nota fica registrada aqui (formato `Superseded (in part)`).

## Referências

- [Replit Postgres docs](https://docs.replit.com/cloud-services/storage-and-databases/postgresql-on-replit)
- [Neon — extensions supported](https://neon.tech/docs/extensions/pg-extensions)
- [Apache AGE — installation requirements](https://age.apache.org/age-manual/master/intro/getting_started.html)
- [NetworkX — performance considerations](https://networkx.org/documentation/stable/reference/algorithms/index.html)
- LGPD (Lei nº 13.709/2018) — escopo do piloto.
- Edital CPSI — Município de Brusque/SC.
