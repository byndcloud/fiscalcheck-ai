# Módulo 7 — Suporte, Capacitação e Funcionalidades Adicionais

> Adoção pela equipe, transferência de conhecimento e diferenciais agênticos de TRL elevado.
> Pasta: `apps/api/src/fiscocheck_api/modules/support/`.

## Objetivo (do edital)

> Garantir adoção, suporte com SLA, capacitação (5 treinamentos), simulador para novos auditores, copilot fiscal e geofiscalização.

## Funcionalidades-chave

- **Suporte Técnico com SLA** — operação assistida durante o projeto.
- **Capacitação** — programa estruturado de 5 treinamentos + transferência de conhecimento.
- **Ambiente de Simulação** — dados históricos **anonimizados** para treino prático.
- **Copilot Fiscal** — assistente conversacional sobre legislação, critérios de risco e histórico do contribuinte.
- **Geofiscalização** — visão computacional + APIs de mapas para apoio à construção civil.
- **Manutenção evolutiva** — adaptação a mudanças normativas.

## Arquitetura interna

```
modules/support/
├── router.py
├── service.py
├── schemas.py
├── models.py
├── repository.py
├── copilot/             # Copilot Fiscal
│   ├── rag.py           # busca em pgvector
│   ├── tools.py         # ferramentas (consulta contribuinte, risco, histórico)
│   ├── graph.py         # LangGraph state machine
│   └── prompts/         # templates em pt-BR
├── simulator/           # ambiente de simulação
│   ├── seed.py          # gera dataset sintético
│   └── scenarios/       # cenários didáticos
├── geofiscalizacao/     # CV + mapas
│   ├── providers.py     # Google Maps / OSM / etc.
│   └── detectors.py     # detecção de construção/expansão
└── help/                # base de conhecimento / tickets
```

## Dependências entre módulos

- **Entrada:** legislação municipal (a indexar em pgvector), histórico do contribuinte (módulos 1–4).
- **Saída:** insights conversacionais para o auditor; dados anonimizados para o simulador.

## Métricas / SLA

- **SLA de suporte**: a definir contratualmente (proposta inicial: P1 ≤ 4h, P2 ≤ 1 dia útil, P3 ≤ 5 dias úteis).
- **Capacitação**: 5 treinamentos planejados com material e gravações.
- **Cobertura RAG** do copilot: ≥ 95% das normas tributárias municipais indexadas.

## Decisões pendentes

- **LLM** do copilot: OpenAI GPT-4o-mini? Anthropic Claude Haiku? Modelo open-source self-hosted (LGPD-friendly)?
- **Embeddings**: `text-embedding-3-small` (OpenAI) vs `multilingual-e5` open-source?
- **APIs de mapas**: Google Maps (custo) vs Mapbox vs OSM (open source)?
- **Detecção de construção**: modelo pré-treinado (e.g., Mask R-CNN sobre Sentinel-2) ou serviço externo?
- **Como anonimizar** dados para o simulador de forma reversível auditavelmente?
