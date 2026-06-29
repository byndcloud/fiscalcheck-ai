import { create } from "zustand";

/**
 * Store global de UI.
 *
 * Use apenas para estado de UI compartilhado (sidebars, modais,
 * filtros globais). Estado de servidor é responsabilidade do
 * TanStack Query — NÃO duplique aqui.
 */
interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
