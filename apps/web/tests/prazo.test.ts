import { describe, expect, it } from "vitest";

import { prazoInfo } from "@/lib/prazo";

/*
  T14 — contagem regressiva de prazos: escala muted → warn (âmbar, ≤3d)
  → danger (vence hoje/vencido), compartilhada entre Kanban, Lista e
  dossiê.
*/

const NOW = new Date("2026-07-06T10:00:00").getTime();

describe("prazoInfo (T14)", () => {
  it("sem prazo → muted, sem countdown", () => {
    const info = prazoInfo(undefined, NOW);
    expect(info).toEqual({
      label: "Sem prazo",
      tone: "muted",
      diasRestantes: null,
      vencido: false,
    });
  });

  it("prazo com folga (>3d) → muted com dias restantes", () => {
    const info = prazoInfo("2026-07-20", NOW);
    expect(info.tone).toBe("muted");
    expect(info.diasRestantes).toBe(14);
    expect(info.label).toBe("Vence em 14d");
    expect(info.vencido).toBe(false);
  });

  it("vence em até 3 dias → alerta âmbar (warn)", () => {
    const info = prazoInfo("2026-07-08", NOW);
    expect(info.tone).toBe("warn");
    expect(info.diasRestantes).toBe(2);
  });

  it("vence hoje → danger", () => {
    const info = prazoInfo("2026-07-06", NOW);
    expect(info.tone).toBe("danger");
    expect(info.label).toBe("Vence hoje");
    expect(info.vencido).toBe(false);
  });

  it("vencido → danger com destaque (aceite: vencidos destacados na fila)", () => {
    const info = prazoInfo("2026-07-01", NOW);
    expect(info.tone).toBe("danger");
    expect(info.vencido).toBe(true);
    expect(info.label).toBe("Vencido há 5d");
  });
});
