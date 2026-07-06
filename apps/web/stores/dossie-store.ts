import { create } from "zustand";

/**
 * Store global do Dossiê de caso (usado por T18 e T24).
 *
 * `CaseDossieSheet` (T13) só era montado dentro de /cases, controlado
 * por `useState` local daquela página. O chip "Contexto: CS-..." do
 * Copilot e os resultados da busca global precisam abrir o mesmo Sheet
 * de qualquer tela — este store guarda só QUAL caso está aberto; o
 * Sheet em si é montado uma única vez no AppShell (ver app-shell.tsx).
 */
interface DossieState {
  openCasoId: string | null;
  openDossie: (casoId: string) => void;
  closeDossie: () => void;
}

export const useDossieStore = create<DossieState>((set) => ({
  openCasoId: null,
  openDossie: (casoId) => set({ openCasoId: casoId.toLowerCase() }),
  closeDossie: () => set({ openCasoId: null }),
}));
