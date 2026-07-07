import type { MetaPiloto } from "@fiscalcheck/shared-types";

/*
  Metas oficiais do piloto de Brusque (RF05 do edital).
  Baseline coletado no diagnóstico inicial de janeiro/2026; alvos
  fixados no plano de aceite; prazo final em 30/12/2026.

  A fixture inicial já traz uma meta em risco (usabilidade), para
  demonstrar o fluxo do alerta automático "meta em risco" no sino
  (T17 · FA06 — Agente de Relatórios).

  Status é calculado no handler MSW pela função `computeMetaStatus`
  (`apps/web/lib/analytics/meta-status.ts`) — os valores aqui são
  apenas snapshot do último cálculo.
*/

export const PRAZO_FINAL = "2026-12-30T23:59:59Z";

export const metasPilotoFixture: MetaPiloto[] = [
  {
    id: "meta-acuracia",
    codigo: "acuracia",
    nome: "Acurácia do modelo de risco",
    descricao: "Precisão do score preditivo em cenários golden validados.",
    unidade: "pct",
    baseline: 0.52,
    atual: 0.66,
    alvo: 0.7,
    progressoPct: 0.78,
    status: "no_alvo",
    prazoEm: PRAZO_FINAL,
    atualizadoEm: "2026-07-03T18:00:00Z",
    fonte: "Golden tests + amostra amostral do módulo 3",
    afericaoTR: {
      referencia: "TR 7.2.1",
      formula: "Acurácia (%) = (classificações confirmadas ÷ casos da subamostra auditada) × 100",
      metodo:
        "Validação por subamostra aleatória de casos classificados pelo modelo, auditada manualmente pela equipe fiscal do Município.",
    },
  },
  {
    id: "meta-escala",
    codigo: "escala",
    nome: "Ganho de escala",
    descricao: "Aumento da produtividade da fiscalização vs. baseline pré-piloto.",
    unidade: "num",
    baseline: 1.0,
    atual: 1.85,
    alvo: 2.0,
    progressoPct: 0.85,
    status: "no_alvo",
    prazoEm: PRAZO_FINAL,
    atualizadoEm: "2026-07-04T12:00:00Z",
    fonte: "Casos decididos por auditor · semana (módulo 4)",
    afericaoTR: {
      referencia: "TR 7.2.2",
      formula:
        "Ganho (%) = ((casos analisados no piloto − baseline mensal) ÷ baseline mensal) × 100",
      metodo:
        "Comparação com a média histórica de capacidade formalizada no início do piloto (baseline registrado em jan/2026).",
    },
  },
  {
    id: "meta-usabilidade",
    codigo: "usabilidade",
    nome: "Usabilidade (nota SUS)",
    descricao: "Média das avaliações SUS respondidas pelos auditores.",
    unidade: "score",
    baseline: 62,
    atual: 71,
    alvo: 80,
    progressoPct: 0.5,
    status: "em_risco",
    prazoEm: PRAZO_FINAL,
    atualizadoEm: "2026-07-02T14:20:00Z",
    fonte: "Questionário SUS · System Usability Scale",
    afericaoTR: {
      referencia: "TR 7.2.3",
      formula: "Nota SUS = média das 10 questões padronizadas (escala 0–100) dos respondentes",
      metodo:
        "Questionário estruturado baseado em SUS aplicado in-app aos usuários do piloto nos últimos 15 dias, com tabulação exportável.",
    },
  },
];
