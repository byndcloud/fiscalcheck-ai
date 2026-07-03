"use client";

import { Clock } from "lucide-react";

import { AGENT_STATUS_META, EXECUTION_EVENT_META } from "@/components/agents/agent-status";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { PipelineAgent } from "@/lib/mocks/agents";
import { cn } from "@/lib/utils";

interface AgentDetailSheetProps {
  agent: PipelineAgent | null;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailSheet({ agent, onOpenChange }: AgentDetailSheetProps) {
  const statusMeta = agent ? AGENT_STATUS_META[agent.status] : null;

  return (
    <Sheet open={agent !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {agent && statusMeta ? (
          <>
            <SheetHeader>
              <SheetTitle>{agent.nome}</SheetTitle>
              <SheetDescription>
                {agent.id} · {agent.modulo}
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <p className="text-sm text-muted-foreground">{agent.descricao}</p>

              <div className="flex items-center gap-2 rounded-md bg-n-25 px-3 py-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    statusMeta.dotClassName,
                    statusMeta.animationClassName,
                  )}
                />
                <span className="text-sm font-medium text-text-strong">{statusMeta.label}</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {formatRelativeTime(agent.ultimaExecucao)}
                </span>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md border p-2">
                  <dt className="text-muted-foreground">Processados</dt>
                  <dd className="font-mono text-sm font-semibold text-text-strong">
                    {agent.itensProcessados.toLocaleString("pt-BR")}
                  </dd>
                </div>
                <div className="rounded-md border p-2">
                  <dt className="text-muted-foreground">Fila</dt>
                  <dd className="font-mono text-sm font-semibold text-text-strong">{agent.fila}</dd>
                </div>
                <div className="rounded-md border p-2">
                  <dt className="text-muted-foreground">Tempo médio</dt>
                  <dd className="font-mono text-sm font-semibold text-text-strong">
                    {agent.tempoMedioMs} ms
                  </dd>
                </div>
              </dl>

              <div className="flex min-h-0 flex-1 flex-col">
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Histórico de execuções
                </h3>
                <ScrollArea className="h-80 rounded-md border">
                  <ol className="divide-y">
                    {agent.eventos.map((evento) => {
                      const eventoMeta = EXECUTION_EVENT_META[evento.tipo];
                      return (
                        <li key={evento.id} className="flex gap-3 px-3 py-3">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1 size-2 shrink-0 rounded-full",
                              eventoMeta.dotClassName,
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-text-strong">{evento.mensagem}</p>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {formatRelativeTime(evento.timestamp)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </ScrollArea>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
