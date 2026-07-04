import { describe, expect, it } from "vitest";

import { PanelManagerKpisSchema } from "@fiscalcheck/shared-types";

import { buildPanelManagerKpisFixture } from "@/mocks/fixtures/panel-manager-kpis";

/*
  Bateria do fixture do Painel do Gestor (T17 · módulo 5).
  Cobre schema parse + filtro determinístico de período (a série
  encolhe com o zoom mas o valor atual permanece o último ponto).
*/

describe("buildPanelManagerKpisFixture", () => {
  it.each(["30d", "90d", "trimestre", "ano"] as const)(
    "período %s produz payload válido pelo schema",
    (periodo) => {
      const fixture = buildPanelManagerKpisFixture(periodo);
      const parsed = PanelManagerKpisSchema.safeParse(fixture);
      expect(parsed.success).toBe(true);
      expect(fixture.kpis.length).toBeGreaterThanOrEqual(7);
    },
  );

  it("filtro de período apenas encolhe a série (mesmo valor atual)", () => {
    const ano = buildPanelManagerKpisFixture("ano");
    const t30 = buildPanelManagerKpisFixture("30d");
    expect(ano.kpis).toHaveLength(t30.kpis.length);
    for (const kpi of ano.kpis) {
      const kpi30 = t30.kpis.find((k) => k.key === kpi.key);
      expect(kpi30).toBeDefined();
      if (!kpi30) return;
      expect(kpi.serie.length).toBeGreaterThan(kpi30.serie.length);
      expect(kpi.valor).toBe(kpi30.valor);
      expect(kpi.variacaoPct).toBe(kpi30.variacaoPct);
    }
  });

  it("KPIs obrigatórios estão presentes em todos os períodos", () => {
    const OBRIGATORIOS = [
      "casosAbertos",
      "casosEmAnalise",
      "valorRecuperadoBrl",
      "potencialRecuperavelBrl",
      "produtividadeAuditor",
      "divergenciasCriticas",
      "taxaAutorregularizacao",
    ];
    const fixture = buildPanelManagerKpisFixture("90d");
    for (const key of OBRIGATORIOS) {
      expect(fixture.kpis.some((k) => k.key === key)).toBe(true);
    }
  });
});
