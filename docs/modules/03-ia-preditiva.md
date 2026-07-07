# Módulo 3 — Inteligência Artificial e Análise Preditiva

> Priorização baseada em risco, com explicabilidade e melhoria contínua.
> Pasta: `apps/api/src/fiscalcheck_api/modules/ai/`.

## Objetivo (do edital)

> Calcular a probabilidade de inconsistência de cada contribuinte, considerando atributos e topologia de relações, com explicabilidade defensável e mecanismo de aprendizado contínuo.

## Funcionalidades-chave

- **Score de Risco do Contribuinte** — IA preditiva sobre histórico + cruzamentos.
- **Scoring de Risco de Redes** — usa topologia (centralidade, comunidades) além de atributos.
- **Parametrização pela Secretaria** — pesos ajustáveis sem refactor.
- **Explicabilidade (XAI)** — registro dos fatores que justificam cada classificação.
- **Active Learning** — cada feedback do auditor realimenta retrain + calibragem (agente de calibragem).

## Entrega T08 · Fila priorizada e Visão 360 (MVP web)

> Frente de UI do RF03/FA03, entregue no `apps/web` sobre a camada mock (MSW).

- **Página `/fila-de-risco`** (papéis auditoriais) — fila de contribuintes ordenada pelo Agente de Score (desc, nunca re-priorizada pelo front), com rótulo aurora "Fila ordenada pelo Agente de Score", score-chip + pill semáforo (DS §3.3/§8), valor potencial recuperável, setor (CNAE), situação cadastral e status de tratamento (caso vinculado ou "sem tratamento"). Dados compostos pelo mock em `GET /ai/queue` (`RiskQueueItem`).
- **Segmentação da carteira** — chips-filtro combináveis por nível de risco (com contagem e valor potencial somado), porte/regime e tipo de inconsistência — visão macro para direcionar campanhas por segmento.
- **Visão 360 `/fila-de-risco/[contribuinteId]`** — agregado `GET /taxpayers/:id/360` (`Contribuinte360`): medidor de score do DS §8 (`RiskGauge`, SVG acessível com `role="meter"`), próxima ação sempre rotulada como recomendação do agente, e abas com T09 embutido + evolução do score no tempo (`ScoreHistoryChart`, com `modeloVersao` por ponto para rastreabilidade), declarações × NFS-e, dívida ativa × pagamentos e casos vinculados (deep-link para o dossiê T13).
- **Coerência de dados** — a evolução do score segue o calendário de publicações do modelo (T02: v2.2 → v2.4) e as declarações mock narram os mesmos indícios dos fatores XAI; contribuintes sem score exercitam os empty states.

## Entrega T09 · Explicabilidade das classificações (MVP web)

> Frente de UI do RF03, entregue no `apps/web` sobre a camada mock (MSW).

- **`ScoreFactorsPanel`** (`apps/web/components/risk/score-factors-panel.tsx`) — painel "Por que este score?": barras de contribuição por fator (±pts) ordenadas por magnitude no espectro de risco do DS, origem do fator (cruzamento / rede societária / cadastro / histórico), evidência textual e rodapé com a nota "Explicabilidade registrada para defesa perante órgãos de controle" + `modeloVersao`/`calculadoEm`.
- **Pontos de acesso** — todo score exibido dá acesso ao painel (critério de aceite): seção fixa no Dossiê do caso (T13), botão "Ver fatores" na tabela de scores em `/ia-preditiva` (antiga `/ai`; Sheet lateral), botão "Ver fatores" nos casos priorizados do Dashboard e painel embutido no detalhe da divergência em `/crossing` (T05). O PDF do dossiê (T28) já incorporava os mesmos fatores.
- **Coerência de dados** — os scores mock (`apps/web/mocks/fixtures/scores.ts`) espelham o `scoreValor` dos casos e narram os mesmos indícios da recomendação do orquestrador.

## Entrega T12 · Análise de Redes / Graph Analytics (MVP web)

> Frente de UI do RF08/FA09, entregue no `apps/web` sobre a camada mock (MSW).

- **Página `/analise-de-redes`** (papéis auditoriais) — grafo SVG interativo por comunidade suspeita: zoom, seleção de nó, arestas por tipo de vínculo (societário / mesmo endereço / fluxo financeiro) e raio proporcional ao score de risco de rede. Sem lib de grafo nova (ADR-0005) — o volume do POC não justifica dependência.
- **5 cenários demonstráveis** (`apps/web/mocks/fixtures/network-scenarios.ts`, aceite): fragmentação artificial de receita, conluio de fornecedores, interposição de pessoas, endereço compartilhado e rede familiar (revezamento de MEI). Biblioteca listada abaixo do grafo — clicar troca a visualização.
- **Drawer do nó** (aceite: clicar abre o detalhe) — resolução de entidades (identidades unificadas), scoring de risco de rede (score, **centralidade**, **ligações com autuados**), "Abrir dossiê" (deep-link T13) e "Adicionar ao caso" (mock, sujeito à validação do auditor).
- **Padrões + recomendação** — cards de padrões detectados com severidade no espectro de risco e card do agente com CTA "Abrir dossiê consolidado" (redes C-07 e C-11 apontam para casos reais da fila).
- **Filtros combináveis** — comunidade, período, tipos de vínculo (chips) e profundidade (1 nível = nó articulador + vizinhos diretos).

## Arquitetura interna

```text
modules/ai/
├── router.py
├── service.py
├── schemas.py
├── models.py            # tabelas: score_risco, modelo_versao, feedback
├── repository.py
├── features/            # engenharia de features
│   ├── contribuinte.py
│   ├── declaracao.py
│   └── grafo.py
├── models_ml/           # sklearn pipelines + serialização
│   ├── baseline.py      # logística + GBM como baseline auditável
│   └── network.py       # GNN futuro (DGL/PyG) — placeholder
├── xai/                 # SHAP / counterfactuals
└── learning/            # active learning
    └── calibragem.py    # agente em agents/risk_scorer/
```

## Dependências entre módulos

- **Entrada:** casos do módulo 2 + features do módulo 1.
- **Saída:** score + explicabilidade para módulo 4 (priorização do orquestrador).
- **Auditoria:** módulo 6 registra cada decisão de modelo com `modelo_versao` rastreável.

## Métricas / SLA

- **Acurácia** alvo do piloto: ≥ 75% precision@top10 (negociável conforme baseline).
- **Tempo de scoring** de um lote: ≤ 5 min por 100k contribuintes.
- **Explicabilidade**: 100% dos scores acompanhados de top 5 fatores.

## Decisões pendentes

- Baseline inicial: **scikit-learn** (logística calibrada + GBM)?
- GNN para grafo: deixar para fase 2 (após volume de dados consolidado)?
- Explicabilidade: **SHAP** para tabular + **GNNExplainer** quando GNN entrar.
- Como **versionar modelos** de forma auditável: MLflow self-hosted? Pasta `models/` em S3?
