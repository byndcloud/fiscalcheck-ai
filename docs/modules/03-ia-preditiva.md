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

## Entrega T09 · Explicabilidade das classificações (MVP web)

> Frente de UI do RF03, entregue no `apps/web` sobre a camada mock (MSW).

- **`ScoreFactorsPanel`** (`apps/web/components/risk/score-factors-panel.tsx`) — painel "Por que este score?": barras de contribuição por fator (±pts) ordenadas por magnitude no espectro de risco do DS, origem do fator (cruzamento / rede societária / cadastro / histórico), evidência textual e rodapé com a nota "Explicabilidade registrada para defesa perante órgãos de controle" + `modeloVersao`/`calculadoEm`.
- **Pontos de acesso** — todo score exibido dá acesso ao painel (critério de aceite): seção fixa no Dossiê do caso (T13), botão "Ver fatores" na tabela de scores em `/ai` (Sheet lateral), botão "Ver fatores" nos casos priorizados do Dashboard e painel embutido no detalhe da divergência em `/crossing` (T05). O PDF do dossiê (T28) já incorporava os mesmos fatores.
- **Coerência de dados** — os scores mock (`apps/web/mocks/fixtures/scores.ts`) espelham o `scoreValor` dos casos e narram os mesmos indícios da recomendação do orquestrador.

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
