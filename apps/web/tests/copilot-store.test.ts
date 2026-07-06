import { beforeEach, describe, expect, it } from "vitest";

import { useCopilotStore } from "@/stores/copilot-store";

describe("copilot-store (T18)", () => {
  beforeEach(() => {
    useCopilotStore.setState({ open: false, contextoCasoId: null });
  });

  it("abre sem contexto", () => {
    useCopilotStore.getState().openCopilot();
    expect(useCopilotStore.getState()).toMatchObject({ open: true, contextoCasoId: null });
  });

  it("abre com contexto normalizado para minúsculo", () => {
    useCopilotStore.getState().openCopilot("CS-2026-0148");
    expect(useCopilotStore.getState().contextoCasoId).toBe("cs-2026-0148");
  });

  it("closeCopilot fecha o painel sem limpar o contexto", () => {
    useCopilotStore.getState().openCopilot("cs-2026-0148");
    useCopilotStore.getState().closeCopilot();
    expect(useCopilotStore.getState()).toMatchObject({
      open: false,
      contextoCasoId: "cs-2026-0148",
    });
  });

  it("clearContext limpa o contexto sem fechar o painel", () => {
    useCopilotStore.getState().openCopilot("cs-2026-0148");
    useCopilotStore.getState().clearContext();
    expect(useCopilotStore.getState()).toMatchObject({ open: true, contextoCasoId: null });
  });
});
