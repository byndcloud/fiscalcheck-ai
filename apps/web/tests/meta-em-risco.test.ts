import { describe, expect, it } from "vitest";

import { computeMetaStatus, computeProgressoPct, refreshMeta } from "@/lib/analytics/meta-status";

/*
  Bateria do cálculo de status de meta do piloto (T17 · módulo 5).
  As regras estão descritas no cabeçalho de `meta-status.ts`.
*/

const NOW = new Date("2026-07-04T12:00:00Z");
const DEZ_DIAS_DEPOIS = "2026-07-14T12:00:00Z";
const CEM_DIAS_DEPOIS = "2026-10-12T12:00:00Z";

describe("computeProgressoPct", () => {
  it("progresso 0..1 dado baseline/atual/alvo lineares", () => {
    expect(computeProgressoPct(0, 50, 100)).toBeCloseTo(0.5);
    expect(computeProgressoPct(60, 71, 80)).toBeCloseTo(0.55);
  });

  it("progresso é clamp em [0, 1]", () => {
    expect(computeProgressoPct(0, -10, 100)).toBe(0);
    expect(computeProgressoPct(0, 200, 100)).toBe(1);
  });

  it("baseline == alvo devolve 1 quando atingido, 0 caso contrário", () => {
    expect(computeProgressoPct(70, 70, 70)).toBe(1);
    expect(computeProgressoPct(70, 60, 70)).toBe(0);
  });
});

describe("computeMetaStatus — regra de risco", () => {
  it("progresso >= 1 sempre é no_alvo (mesmo perto do prazo)", () => {
    const status = computeMetaStatus({
      baseline: 60,
      atual: 90,
      alvo: 80,
      prazoEm: DEZ_DIAS_DEPOIS,
      now: NOW,
    });
    expect(status.status).toBe("no_alvo");
    expect(status.progressoPct).toBe(1);
  });

  it("prazo longe (>30 dias) sempre é no_alvo, mesmo com progresso baixo", () => {
    const status = computeMetaStatus({
      baseline: 60,
      atual: 62,
      alvo: 80,
      prazoEm: CEM_DIAS_DEPOIS,
      now: NOW,
    });
    expect(status.status).toBe("no_alvo");
  });

  it("prazo próximo e progresso entre 30-60% → em_risco", () => {
    // progresso = (65-60)/(80-60) = 0.25 → crítico. Bump atual para 68 → 0.4 = em_risco.
    const status = computeMetaStatus({
      baseline: 60,
      atual: 68,
      alvo: 80,
      prazoEm: DEZ_DIAS_DEPOIS,
      now: NOW,
    });
    expect(status.progressoPct).toBeCloseTo(0.4);
    expect(status.status).toBe("em_risco");
  });

  it("prazo próximo e progresso < 30% → critico", () => {
    // progresso = (61-60)/(80-60) = 0.05
    const status = computeMetaStatus({
      baseline: 60,
      atual: 61,
      alvo: 80,
      prazoEm: DEZ_DIAS_DEPOIS,
      now: NOW,
    });
    expect(status.status).toBe("critico");
  });
});

describe("refreshMeta", () => {
  it("devolve cópia com status recomputado sem mutar o original", () => {
    const original = {
      id: "meta-usabilidade",
      codigo: "usabilidade" as const,
      nome: "Meta X",
      descricao: "descrição",
      unidade: "score" as const,
      baseline: 62,
      atual: 68,
      alvo: 80,
      progressoPct: 0.0,
      status: "no_alvo" as const,
      prazoEm: DEZ_DIAS_DEPOIS,
      atualizadoEm: "2026-07-01T00:00:00Z",
    };
    const next = refreshMeta(original, NOW);
    expect(next).not.toBe(original);
    expect(original.status).toBe("no_alvo");
    expect(next.status).toBe("em_risco");
  });
});
