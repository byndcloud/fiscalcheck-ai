import { SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Pílula "AGENTE" com gradiente aurora — marca visual de conteúdo
  produzido/assistido por IA (DS §7 · badge aurora). Usada nos cards do
  Kanban e no cabeçalho do dossiê quando `caso.agenteResponsavel` está
  presente.
*/
type Props = {
  className?: string;
  label?: string;
};

export function AgentRecommendationBadge({ className, label = "AGENTE" }: Props) {
  return (
    <span
      role="img"
      aria-label="Recomendação produzida por agente de IA"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[image:var(--grad-aurora)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-[var(--e-1)]",
        className,
      )}
    >
      <SparklesIcon aria-hidden className="size-3" />
      {label}
    </span>
  );
}
