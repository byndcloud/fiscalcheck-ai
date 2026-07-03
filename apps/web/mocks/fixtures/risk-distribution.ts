import type { RiskDistribution } from "@fiscalcheck/shared-types";

/*
  Distribuição dos contribuintes pontuados por nível de risco.
  Valores calibrados para totalizar 8.430 contribuintes — mesmo
  valor exibido no dashboard de referência.
*/
export const riskDistributionFixture: RiskDistribution = {
  totalPontuados: 8_430,
  entradas: [
    { nivel: "conforme", label: "Conforme", contagem: 4_120, percentual: 48.9 },
    { nivel: "baixo", label: "Baixo", contagem: 1_980, percentual: 23.5 },
    { nivel: "medio", label: "Médio", contagem: 1_410, percentual: 16.7 },
    { nivel: "alto", label: "Alto", contagem: 886, percentual: 10.5 },
    { nivel: "critico", label: "Crítico", contagem: 34, percentual: 0.4 },
  ],
};
