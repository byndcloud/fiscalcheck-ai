import { create } from "zustand";

/**
 * Store global do painel do Copilot Fiscal (T18).
 *
 * Precisa abrir de qualquer tela (atalho da topbar) e também de forma
 * contextual a partir do Dossiê de um caso (chip "Contexto: CS-...").
 * Um único `CopilotPanel` é montado no AppShell, lendo este store.
 */
interface CopilotState {
  open: boolean;
  contextoCasoId: string | null;
  openCopilot: (contextoCasoId?: string) => void;
  closeCopilot: () => void;
  clearContext: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  open: false,
  contextoCasoId: null,
  openCopilot: (contextoCasoId) =>
    set({ open: true, contextoCasoId: contextoCasoId ? contextoCasoId.toLowerCase() : null }),
  closeCopilot: () => set({ open: false }),
  clearContext: () => set({ contextoCasoId: null }),
}));
