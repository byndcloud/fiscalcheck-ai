import type {
  IngestionAgentEvent,
  IngestionAgentEventKind,
  IngestionAgentEventSeverity,
} from "@fiscalcheck/shared-types";
import {
  AlertTriangleIcon,
  DatabaseIcon,
  GaugeIcon,
  LockIcon,
  type LucideIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Timeline vertical do Agente de Ingestão 24/7 — cada evento carrega
  ícone por `kind`, timestamp relativo, mensagem e badge opcional
  de qualityPercent. Severity `critical` estampa borda vermelha
  (--c-risk-5) para chamar atenção sem depender do sino.
*/

const KIND_META: Record<
  IngestionAgentEventKind,
  { label: string; Icon: LucideIcon; tint: string }
> = {
  etl: {
    label: "ETL",
    Icon: DatabaseIcon,
    tint: "bg-brand-050 text-brand",
  },
  schema: {
    label: "Schema",
    Icon: ShieldCheckIcon,
    tint: "bg-brand-050 text-brand-deep",
  },
  quality: {
    label: "Qualidade",
    Icon: GaugeIcon,
    tint: "bg-[color:var(--c-risk-2)]/15 text-[color:var(--c-risk-1)]",
  },
  pseudo: {
    label: "Pseudonimização",
    Icon: LockIcon,
    tint: "bg-[image:var(--grad-aurora)] text-white",
  },
  failure: {
    label: "Falha",
    Icon: AlertTriangleIcon,
    tint: "bg-[color:var(--c-risk-5)]/15 text-[color:var(--c-risk-5)]",
  },
};

const SEVERITY_BORDER: Record<IngestionAgentEventSeverity, string> = {
  info: "border-l-transparent",
  warn: "border-l-[color:var(--c-risk-3)]",
  critical: "border-l-[color:var(--c-risk-5)]",
};

const RELATIVE_TIME = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RELATIVE_TIME.format(diffSec, "second");
  if (abs < 3600) return RELATIVE_TIME.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RELATIVE_TIME.format(Math.round(diffSec / 3600), "hour");
  return RELATIVE_TIME.format(Math.round(diffSec / 86400), "day");
}

type AgentTimelineProps = {
  events: IngestionAgentEvent[];
};

export function AgentTimeline({ events }: AgentTimelineProps) {
  return (
    <ol data-slot="agent-timeline" className="relative grid gap-3">
      {events.map((event, idx) => {
        const meta = KIND_META[event.kind];
        const Icon = meta.Icon;
        const isLast = idx === events.length - 1;
        return (
          <li key={event.id} className="relative pl-10">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-8 bottom-[-12px] w-px bg-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-1 grid size-8 place-items-center rounded-full ring-2 ring-background",
                meta.tint,
              )}
            >
              <Icon className="size-4" />
            </span>
            <article
              className={cn(
                "grid gap-1 rounded-lg border border-border bg-card p-3 border-l-2 shadow-[var(--e-1)]",
                SEVERITY_BORDER[event.severity],
              )}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-text-strong">
                  <span>{meta.label}</span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    · {event.sourceName}
                  </span>
                </p>
                <time
                  dateTime={event.timestamp}
                  className="whitespace-nowrap text-[11px] text-muted-foreground"
                >
                  {formatRelative(event.timestamp)}
                </time>
              </header>
              <p className="text-xs text-muted-foreground leading-snug">{event.message}</p>
              {event.qualityPercent !== undefined ? (
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
                      event.qualityPercent >= 98
                        ? "bg-[color:var(--c-risk-2)]/15 text-[color:var(--c-risk-1)]"
                        : event.qualityPercent >= 95
                          ? "bg-[color:var(--c-risk-3)]/15 text-[color:var(--c-risk-3)]"
                          : "bg-[color:var(--c-risk-5)]/15 text-[color:var(--c-risk-5)]",
                    )}
                  >
                    {event.qualityPercent.toFixed(1)}% válidos
                  </span>
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
