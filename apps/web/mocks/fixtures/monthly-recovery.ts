import type { MonthlyRecoverySeries } from "@fiscalcheck/shared-types";

/*
  Série mensal declarado (potencial) vs. recuperado ao longo dos últimos
  12 meses (jul/2025 → jun/2026). Valores em milhares de reais para
  manter as barras legíveis mesmo em telas menores.
*/
export const monthlyRecoveryFixture: MonthlyRecoverySeries = {
  moeda: "BRL",
  unidade: "milhares",
  pontos: [
    { competencia: "2025-07", label: "jul", recuperadoBrl: 210, potencialBrl: 620 },
    { competencia: "2025-08", label: "ago", recuperadoBrl: 268, potencialBrl: 700 },
    { competencia: "2025-09", label: "set", recuperadoBrl: 305, potencialBrl: 740 },
    { competencia: "2025-10", label: "out", recuperadoBrl: 350, potencialBrl: 760 },
    { competencia: "2025-11", label: "nov", recuperadoBrl: 322, potencialBrl: 690 },
    { competencia: "2025-12", label: "dez", recuperadoBrl: 288, potencialBrl: 645 },
    { competencia: "2026-01", label: "jan", recuperadoBrl: 340, potencialBrl: 780 },
    { competencia: "2026-02", label: "fev", recuperadoBrl: 415, potencialBrl: 860 },
    { competencia: "2026-03", label: "mar", recuperadoBrl: 470, potencialBrl: 940 },
    { competencia: "2026-04", label: "abr", recuperadoBrl: 512, potencialBrl: 980 },
    { competencia: "2026-05", label: "mai", recuperadoBrl: 555, potencialBrl: 1010 },
    { competencia: "2026-06", label: "jun", recuperadoBrl: 620, potencialBrl: 1120 },
  ],
};
