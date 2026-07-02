import type { PanelKpis } from "@fiscalcheck/shared-types";

/*
  KPIs "big number" do Painel Gerencial (mês a mês).
  Valores em BRL; a variação é sempre comparando a competência corrente
  com a imediatamente anterior. Valores fictícios calibrados para dar
  variação positiva/negativa realista em cada card.
*/
export const panelKpisFixture: PanelKpis = {
  recuperado: {
    label: "Recuperado · exercício",
    valorBrl: 4_820_000,
    competencia: "2026-06",
    competenciaAnterior: "2026-05",
    variacaoAbsoluta: 720_000,
    variacaoPercentual: 17.6,
    sub: "vs. mês anterior",
  },
  casosAbertos: {
    label: "Casos em aberto",
    valorNumerico: 1_284,
    competencia: "2026-06",
    competenciaAnterior: "2026-05",
    variacaoAbsoluta: -72,
    variacaoPercentual: -5.3,
    sub: "34 críticos aguardando decisão",
  },
  potencialRecuperavel: {
    label: "Potencial recuperável",
    valorBrl: 11_300_000,
    competencia: "2026-06",
    competenciaAnterior: "2026-05",
    variacaoAbsoluta: 940_000,
    variacaoPercentual: 9.1,
    sub: "estimativa da esteira agêntica",
  },
  atualizadoEm: "2026-07-02T14:00:00Z",
};
