"use client";

import { SparklesIcon } from "lucide-react";

import { useCopilotStore } from "@/stores/copilot-store";
import { useSession } from "@/stores/session-store";

/*
  Botão flutuante do Copilot Fiscal (T18), fixo no canto inferior direito.
  Disponível para todos os perfis autenticados — inclusive o cidadão no
  portal — com sugestões de pergunta específicas por papel no painel.
  Some enquanto o painel está aberto para não competir com o Sheet.
*/
export function CopilotFab() {
  const role = useSession((s) => s.role);
  const open = useCopilotStore((s) => s.open);
  const openCopilot = useCopilotStore((s) => s.openCopilot);

  if (!role || open) return null;

  return (
    <button
      type="button"
      aria-label="Abrir Copilot Fiscal"
      onClick={() => openCopilot()}
      className="fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-[image:var(--grad-aurora)] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-050"
    >
      <SparklesIcon className="size-5" aria-hidden="true" />
    </button>
  );
}
