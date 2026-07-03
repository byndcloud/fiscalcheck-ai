import { ArrowRight, User } from "lucide-react";

import { cn } from "@/lib/utils";

const STAGES = ["Ingestão", "Cruzamento & Redes", "Score de risco", "Orquestração"] as const;

/**
 * Barra de fluxo agêntico (DS §8 "Esteira de agentes"): pílulas encadeadas
 * por setas, com a etapa final de decisão humana destacada em azul sólido —
 * reforça que os agentes preparam e recomendam, mas quem decide é o auditor.
 */
export function AgentFlowBar() {
  return (
    <ol
      aria-label="Fluxo agêntico: da ingestão à decisão do auditor"
      className="flex flex-wrap items-center gap-2"
    >
      {STAGES.map((stage) => (
        <li key={stage} className="flex items-center gap-2">
          <span className="rounded-full bg-n-50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {stage}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-n-300" aria-hidden="true" />
        </li>
      ))}
      <li>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground",
          )}
        >
          <User className="size-3.5" aria-hidden="true" />
          Decisão do auditor
        </span>
      </li>
    </ol>
  );
}
