import { AlertTriangleIcon, CheckIcon, type LucideIcon } from "lucide-react";

import type { StatusComunicacao } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Stepper T15 · rastreio ponta-a-ponta da comunicação.

  Passos: enviada → entregue → ciência → respondida.
  `falha` é um caso especial (fora do fluxo feliz) — o stepper marca o
  passo problemático em tom risk-5 e não avança.
*/

type StepKey = "enviada" | "entregue" | "ciencia" | "respondida";

const STEPS: readonly { key: StepKey; label: string; short: string }[] = [
  { key: "enviada", label: "Enviada", short: "Env." },
  { key: "entregue", label: "Entregue", short: "Ent." },
  { key: "ciencia", label: "Ciência registrada", short: "Ciência" },
  { key: "respondida", label: "Respondida", short: "Resp." },
] as const;

const STATE_TO_INDEX: Record<StatusComunicacao, number> = {
  enviada: 0,
  entregue: 1,
  ciencia: 2,
  respondida: 3,
  falha: -1,
};

type StepState = "completed" | "current" | "upcoming" | "failed";

type Props = {
  status: StatusComunicacao;
  timestamps?: Partial<Record<StepKey, string | undefined>>;
  variant?: "full" | "compact";
  className?: string;
};

function formatShort(ts?: string): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.toLocaleDateString("pt-BR")} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function stateFor(status: StatusComunicacao, index: number): StepState {
  if (status === "falha") {
    return index === 0 ? "failed" : "upcoming";
  }
  const reached = STATE_TO_INDEX[status];
  if (index < reached) return "completed";
  if (index === reached) return "current";
  return "upcoming";
}

const STATE_STYLES: Record<
  StepState,
  { dot: string; label: string; bar: string; Icon: LucideIcon | null }
> = {
  completed: {
    dot: "bg-brand text-white border-brand",
    label: "text-text-strong",
    bar: "bg-brand",
    Icon: CheckIcon,
  },
  current: {
    dot: "bg-surface text-brand border-brand shadow-[0_0_0_4px_var(--brand-050)]",
    label: "font-semibold text-brand-deep",
    bar: "bg-n-100",
    Icon: null,
  },
  upcoming: {
    dot: "bg-surface text-muted-foreground border-n-200",
    label: "text-muted-foreground",
    bar: "bg-n-100",
    Icon: null,
  },
  failed: {
    dot: "bg-surface text-[color:var(--c-risk-5)] border-[color:var(--c-risk-5)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--c-risk-5)_18%,transparent)]",
    label: "font-semibold text-[color:var(--c-risk-5)]",
    bar: "bg-n-100",
    Icon: AlertTriangleIcon,
  },
};

export function StatusStepper({ status, timestamps, variant = "full", className }: Props) {
  const compact = variant === "compact";
  return (
    <ol
      aria-label="Rastreio da comunicação"
      className={cn("grid gap-0", compact ? "grid-cols-4 max-w-[280px]" : "grid-cols-4", className)}
    >
      {STEPS.map((step, index) => {
        const stepState = stateFor(status, index);
        const styles = STATE_STYLES[stepState];
        const isLast = index === STEPS.length - 1;
        const ts = formatShort(timestamps?.[step.key]);
        const Icon = styles.Icon;

        return (
          <li
            key={step.key}
            aria-current={stepState === "current" ? "step" : undefined}
            className="relative flex flex-col items-center"
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden="true"
                className={cn("h-[2px] flex-1", index === 0 ? "invisible" : styles.bar)}
              />
              <span
                className={cn(
                  "z-[1] grid place-items-center rounded-full border-2 transition-colors",
                  compact ? "size-5 text-[10px]" : "size-7 text-xs",
                  styles.dot,
                )}
              >
                {Icon ? (
                  <Icon className={compact ? "size-2.5" : "size-3.5"} aria-hidden="true" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-[2px] flex-1",
                  isLast ? "invisible" : STATE_STYLES[stateFor(status, index + 1)].bar,
                )}
              />
            </div>
            {compact ? (
              <span className={cn("mt-1 text-[10px] leading-tight", styles.label)}>
                {step.short}
              </span>
            ) : (
              <span className={cn("mt-2 text-xs text-center leading-tight", styles.label)}>
                {step.label}
                {ts ? (
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                    {ts}
                  </span>
                ) : null}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export const STATUS_LABEL_PT: Record<StatusComunicacao, string> = {
  enviada: "Enviada",
  entregue: "Entregue",
  ciencia: "Ciência",
  respondida: "Respondida",
  falha: "Falha",
};

export const STATUS_TONE: Record<
  StatusComunicacao,
  "risk-1" | "risk-2" | "risk-3" | "risk-4" | "risk-5" | "neutral" | "info"
> = {
  enviada: "info",
  entregue: "risk-3",
  ciencia: "risk-2",
  respondida: "risk-1",
  falha: "risk-5",
};
