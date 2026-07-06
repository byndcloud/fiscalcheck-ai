# Módulo 2 — Cruzamento e Detecção de Inconsistências

> Núcleo analítico: identificação ativa de omissões, subdeclarações e contribuintes fora do radar.
> Pasta: `apps/api/src/fiscalcheck_api/modules/crossing/`.

## Objetivo (do edital)

> Confrontar sistematicamente o valor declarado e o efetivamente documentado nas NFS-e, identificando divergências de base de cálculo, expondo conluio e fragmentação artificial via grafos, e monitorando NFS-e em quase tempo real (CTC).

## Funcionalidades-chave

- **Cruzamento NFS-e x declarado** — confronto sistemático com evidências anexadas.
- **Identificação de informais, subdeclarantes, inativos** — varredura ampliada inclusive em NFS-e de terceiros, meios de pagamento e fontes abertas.
- **Agente Gatekeeper Fiscal** — abre casos candidatos com evidências após cada carga validada.
- **Graph Analytics + Resolução de Entidades** — Apache AGE; expõe conluio e operações simuladas.
- **Monitoramento Contínuo (CTC)** — scoring incremental sobre cada lote de NFS-e.

## Arquitetura interna

```text
modules/crossing/
├── router.py
├── service.py
├── schemas.py
├── models.py            # caso, evidencia, divergencia
├── repository.py
├── strategies/          # uma estratégia por tipo de cruzamento
│   ├── subdeclaracao.py
│   ├── omissao.py
│   ├── informal.py
│   ├── inativo_com_atividade.py
│   └── non_filer_discovery.py
├── graph/               # Apache AGE + NetworkX
│   ├── builders.py      # constrói nós e arestas
│   ├── resolvers.py     # entity resolution
│   └── analytics.py     # centralidade, comunidades
└── ctc/                 # monitoramento contínuo
```

## Dependências entre módulos

- **Entrada:** dados normalizados do módulo 1.
- **Saída:** casos candidatos com evidências para o módulo 3 (score) e módulo 4 (gestão).
- **Compliance:** módulo 6 garante que todo cruzamento respeita RBAC.

## Métricas / SLA

- **Tempo médio** da disponibilização da carga até abertura do caso: ≤ 1h.
- **Precisão** dos cruzamentos: ≥ 80% (validado com feedback do auditor; calibrado pelo módulo 3).
- **Cobertura** de NFS-e processadas em CTC: 100% dentro de 30 minutos.

## Entrega T05 · Cruzamento e Inconsistências (RF02/FA02)

Tela `/crossing` (front-end, dados mock) reconstruída como **caso instruído e auditável, não alerta estatístico**:

- **Lista de divergências** declarado × NFS-e com badge do tipo, badge **AGENTE** na origem, diferença (R$) em destaque e StatusBadge de risco; estados vazio/carregando/erro via `AsyncBoundary` (T25).
- **Filtros combináveis** (E entre dimensões, OU nos chips): tipo em chips — incluindo o novo `inativo_atividade` ("inativo com atividade") —, período (competência), faixa de valor e setor (derivado da divisão CNAE da atividade principal). Lógica pura em `apps/web/lib/crossing/filter-divergencias.ts` com golden tests.
- **Detalhe lado a lado**: valor declarado × documentado em NFS-e com o **cálculo explícito da diferença** (apurado − declarado = diferença), evidências primárias nominais (NFS-e com número, emissão, valor e ISS) e link para o Dossiê (T13) via deep-link `/cases?caso=…`. Painel "Por que este score?" (T09) incluso quando o contribuinte tem score.
- **Fixtures consistentes por invariante testada**: todo `divergenciaId` referenciado em `casosFixture` existe; `valorApurado − valorDeclarado = valor`; NFS-e de evidência somam exatamente o `valorApurado`.

## Entrega T06 · Non-filer Discovery (RF02)

Aba **"Fora do radar"** em `/crossing` (front-end, dados mock):

- Fila **priorizada por receita estimada não declarada** (12 meses) de prestadores sem cadastro mobiliário nem declaração compatível.
- Cada item explicita **qual fonte revelou o indício** (badge por fonte: NFS-e de terceiros, meios de pagamento, fonte aberta) com resumo, referência auditável e valor estimado por indício.
- CTA **"Iniciar inscrição de ofício"** com diálogo de confirmação do auditor (AGENTS.md §1.1) que abre um **caso candidato real** na fila do módulo 4 (`POST /crossing/non-filers/:id/open-case`), com recomendação estruturada baseada nos indícios; segunda tentativa devolve 409 com o caso já aberto.
- Estados vazio/carregando/erro via `AsyncBoundary`; documentos sempre mascarados.

## Entrega T07 · Feed de Monitoramento Contínuo CTC (RF09/FA10)

Aba **"Monitoramento CTC"** em `/crossing` (front-end, dados mock):

- Feed **em quase tempo real**: o handler MSW simula lotes de NFS-e chegando a cada 8s (geração determinística por `seq`, sem aleatoriedade) e o front atualiza sozinho com `refetchInterval` de 5s.
- Contadores da janela corrente: lotes, NFS-e processadas, alertas antecipados e **janela média "fato gerador → detecção"** em minutos.
- Item alertado realçado em âmbar mostra **a regra que disparou** (5 regras de monitoramento) e a janela individual de detecção.
- CTA **"Sugerir autorregularização"**: abre caso candidato real com recomendação `autorregularizacao` citando a regra (`POST /crossing/ctc/alerts/:id/suggest`) — o convite ao contribuinte só sai depois do fluxo de aprovação do módulo 4. Link para os casos abertos nos últimos minutos.

## Decisões pendentes

- **Apache AGE** vs **TigerGraph/Neo4j externo**? (Recomendação: AGE para piloto; reavaliar em produção se grafo passar de 100M arestas.)
- **Resolução de entidades**: heurística por similaridade de string + telefone + endereço, ou ML (Splink)?
- **Threshold de divergência** para abrir caso: parametrizável (módulo 6).
