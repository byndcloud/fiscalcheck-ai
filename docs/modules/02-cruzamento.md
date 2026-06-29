# Módulo 2 — Cruzamento e Detecção de Inconsistências

> Núcleo analítico: identificação ativa de omissões, subdeclarações e contribuintes fora do radar.
> Pasta: `apps/api/src/fiscocheck_api/modules/crossing/`.

## Objetivo (do edital)

> Confrontar sistematicamente o valor declarado e o efetivamente documentado nas NFS-e, identificando divergências de base de cálculo, expondo conluio e fragmentação artificial via grafos, e monitorando NFS-e em quase tempo real (CTC).

## Funcionalidades-chave

- **Cruzamento NFS-e x declarado** — confronto sistemático com evidências anexadas.
- **Identificação de informais, subdeclarantes, inativos** — varredura ampliada inclusive em NFS-e de terceiros, meios de pagamento e fontes abertas.
- **Agente Gatekeeper Fiscal** — abre casos candidatos com evidências após cada carga validada.
- **Graph Analytics + Resolução de Entidades** — Apache AGE; expõe conluio e operações simuladas.
- **Monitoramento Contínuo (CTC)** — scoring incremental sobre cada lote de NFS-e.

## Arquitetura interna

```
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

## Decisões pendentes

- **Apache AGE** vs **TigerGraph/Neo4j externo**? (Recomendação: AGE para piloto; reavaliar em produção se grafo passar de 100M arestas.)
- **Resolução de entidades**: heurística por similaridade de string + telefone + endereço, ou ML (Splink)?
- **Threshold de divergência** para abrir caso: parametrizável (módulo 6).
