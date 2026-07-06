import { beforeEach, describe, expect, it } from "vitest";

import { useDossieStore } from "@/stores/dossie-store";

describe("dossie-store (usado por T18/T24)", () => {
  beforeEach(() => {
    useDossieStore.setState({ openCasoId: null });
  });

  it("abre um caso normalizando o id para minúsculo", () => {
    useDossieStore.getState().openDossie("CS-2026-0148");
    expect(useDossieStore.getState().openCasoId).toBe("cs-2026-0148");
  });

  it("fecha o dossiê", () => {
    useDossieStore.getState().openDossie("cs-2026-0148");
    useDossieStore.getState().closeDossie();
    expect(useDossieStore.getState().openCasoId).toBeNull();
  });
});
