import type { KpiTrend, PanelManagerKpis, PanelManagerPeriodo } from "@fiscalcheck/shared-types";

/*
  Painel do Gestor (T17 · módulo 5). Cada indicador carrega uma série
  temporal (`serie`) de 12 pontos — a UI usa como sparkline dentro do
  KpiTrendCard e como base do drill-down para /cases quando aplicável.

  Os valores estão calibrados para ficarem coerentes com o restante
  do repo (fixtures de casos, scores, notificações) — casos em aberto,
  por exemplo, batem com o total de status `candidato + em_analise +
  aguardando_aprovacao` da fixture de casos (41 total, 30 abertos).

  O filtro por período reduz proporcionalmente a série (últimos N
  pontos), sem alterar valor/tendência. Ajustes finos ficam na função
  `filterByPeriodo` do handler.
*/

const KPI_TEMPLATES: readonly KpiTrend[] = [
  {
    key: "casosAbertos",
    label: "Casos em aberto",
    descricao: "candidato + em_analise + aguardando_aprovacao",
    unidade: "int",
    valor: 30,
    variacaoPct: -6.3,
    positive: true,
    sub: "vs. mês anterior",
    serie: [42, 40, 41, 38, 37, 36, 35, 34, 33, 32, 31, 30],
    drillDownHref: "/cases",
  },
  {
    key: "casosEmAnalise",
    label: "Casos em análise",
    descricao: "auditoria em andamento",
    unidade: "int",
    valor: 9,
    variacaoPct: 12.5,
    positive: true,
    sub: "aumento saudável de vazão",
    serie: [4, 5, 6, 6, 7, 7, 8, 8, 8, 9, 9, 9],
    drillDownHref: "/cases",
  },
  {
    key: "valorRecuperadoBrl",
    label: "Valor recuperado",
    descricao: "no exercício corrente",
    unidade: "brl",
    valor: 4_820_000,
    variacaoPct: 17.6,
    positive: true,
    sub: "vs. mês anterior",
    serie: [
      2_100_000, 2_300_000, 2_650_000, 2_920_000, 3_150_000, 3_380_000, 3_620_000, 3_840_000,
      4_100_000, 4_350_000, 4_600_000, 4_820_000,
    ],
  },
  {
    key: "potencialRecuperavelBrl",
    label: "Potencial recuperável",
    descricao: "estimativa da esteira agêntica",
    unidade: "brl",
    valor: 14_580_000,
    variacaoPct: 9.1,
    positive: true,
    sub: "vs. mês anterior",
    serie: [
      8_400_000, 8_700_000, 9_000_000, 9_200_000, 9_500_000, 9_800_000, 10_000_000, 10_300_000,
      10_600_000, 10_900_000, 11_100_000, 14_580_000,
    ],
  },
  {
    key: "produtividadeAuditor",
    label: "Produtividade auditor",
    descricao: "casos decididos por auditor · semana",
    unidade: "int",
    valor: 12,
    variacaoPct: 20.0,
    positive: true,
    sub: "média móvel 4 semanas",
    serie: [6, 7, 7, 8, 8, 9, 10, 10, 11, 11, 12, 12],
  },
  {
    key: "divergenciasCriticas",
    label: "Divergências críticas",
    descricao: "score ≥ 80 sem decisão",
    unidade: "int",
    valor: 8,
    variacaoPct: -20.0,
    positive: true,
    sub: "redução após priorização",
    serie: [14, 13, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8],
    drillDownHref: "/cases",
  },
  {
    key: "taxaAutorregularizacao",
    label: "Autorregularização",
    descricao: "casos resolvidos sem lançamento",
    unidade: "pct",
    valor: 0.62,
    variacaoPct: 8.8,
    positive: true,
    sub: "vs. trimestre anterior",
    serie: [0.48, 0.5, 0.51, 0.53, 0.54, 0.55, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62],
    drillDownHref: "/cases",
  },
];

/*
  Fatias por período: cortam a série pelas caudas mais recentes.
  O valor/tendência do card sempre reflete o último ponto — mudar
  período apenas troca o comprimento visível do sparkline e a leitura
  humana ("30 dias" vs "trimestre") no cabeçalho.
*/
const PERIOD_POINTS: Record<PanelManagerPeriodo, number> = {
  "30d": 4,
  "90d": 6,
  trimestre: 9,
  ano: 12,
};

export function buildPanelManagerKpisFixture(periodo: PanelManagerPeriodo): PanelManagerKpis {
  const points = PERIOD_POINTS[periodo];
  return {
    periodo,
    atualizadoEm: "2026-07-04T12:30:00Z",
    kpis: KPI_TEMPLATES.map((k) => ({
      ...k,
      serie: k.serie.slice(-points),
    })),
  };
}

export const panelManagerKpisFixture = buildPanelManagerKpisFixture("30d");
