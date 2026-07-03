import { AlertTriangle, CheckCircle2, Clock, ListTree, Moon } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineAgent } from "@/lib/mocks/agents";
import { cn } from "@/lib/utils";

function countByStatus(agents: PipelineAgent[], status: PipelineAgent["status"]): number {
  return agents.filter((agent) => agent.status === status).length;
}

const TONE_CLASSNAME = {
  success: "bg-success/10 text-success",
  muted: "bg-n-400/10 text-n-500",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
} as const;

interface SummaryItem {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof TONE_CLASSNAME;
}

/** Anatomia de KPI card do DS §7: label caps 11px/700 + tile de ícone 30px tingido a 10%. */
export function AgentsSummaryCards({ agents }: { agents: PipelineAgent[] }) {
  const filaTotal = agents.reduce((total, agent) => total + agent.fila, 0);
  const tempoMedioGeral =
    agents.length > 0
      ? Math.round(agents.reduce((total, agent) => total + agent.tempoMedioMs, 0) / agents.length)
      : 0;

  const summary: SummaryItem[] = [
    {
      label: "Agentes ativos",
      value: countByStatus(agents, "ativo"),
      icon: CheckCircle2,
      tone: "success",
    },
    { label: "Agentes ociosos", value: countByStatus(agents, "ocioso"), icon: Moon, tone: "muted" },
    {
      label: "Agentes em erro",
      value: countByStatus(agents, "erro"),
      icon: AlertTriangle,
      tone: "destructive",
    },
    { label: "Itens em fila", value: filaTotal, icon: ListTree, tone: "info" },
    { label: "Tempo médio geral", value: `${tempoMedioGeral} ms`, icon: Clock, tone: "info" },
  ];

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      aria-label="Resumo da esteira de agentes"
    >
      {summary.map((item) => (
        <Card key={item.label} className="py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {item.label}
            </CardTitle>
            <CardAction>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[30px] items-center justify-center rounded-[var(--r-md)]",
                  TONE_CLASSNAME[item.tone],
                )}
              >
                <item.icon className="size-4" />
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="px-4">
            <p className="font-display text-2xl font-bold text-text-strong">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
