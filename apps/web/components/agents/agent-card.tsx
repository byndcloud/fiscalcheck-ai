"use client";

import { Clock } from "lucide-react";

import { AGENT_STATUS_META } from "@/components/agents/agent-status";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { PipelineAgent } from "@/lib/mocks/agents";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: PipelineAgent;
  onSelect: (agentId: string) => void;
}

/**
 * Card da esteira de agentes (DS §8). Renderizado como <button> — não <div
 * onClick> — para foco de teclado e ativação por Enter/Espaço saírem de
 * graça, conforme a regra de acessibilidade não-negociável do projeto.
 */
export function AgentCard({ agent, onSelect }: AgentCardProps) {
  const statusMeta = AGENT_STATUS_META[agent.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(agent.id)}
      aria-haspopup="dialog"
      className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-left shadow-[var(--e-1)] transition-[transform,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-ds)] outline-none hover:-translate-y-[3px] hover:shadow-[var(--e-3)] focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex size-[42px] shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[image:var(--grad-aurora-tile)] font-display text-sm font-bold text-white"
        >
          {agent.id.slice(2)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-strong">{agent.nome}</p>
          <p className="truncate text-[11px] text-muted-foreground">{agent.modulo}</p>
          <p className="font-mono text-[11px] text-n-400">{agent.id}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-n-25 px-3 py-2">
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            statusMeta.dotClassName,
            statusMeta.animationClassName,
          )}
        />
        <span className="text-xs font-medium text-text-strong">{statusMeta.label}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {agent.itensProcessados.toLocaleString("pt-BR")} itens
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Fila</dt>
          <dd className="font-mono font-semibold text-text-strong">{agent.fila}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tempo médio</dt>
          <dd className="font-mono font-semibold text-text-strong">{agent.tempoMedioMs} ms</dd>
        </div>
      </dl>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        Última atividade: {formatRelativeTime(agent.ultimaExecucao)}
      </p>
    </button>
  );
}
