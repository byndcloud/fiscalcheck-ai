import type * as React from "react";

import type { NivelRisco, StatusCaso } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — StatusBadge.
  - Espectro de risco §3.3 do DS: --c-risk-1..5 (verde → vermelho).
  - Mapeia também status de caso para uma paleta semântica compatível.
  Nunca usar hue avulso — só os tokens.
*/

type RiskLevel = "risk-1" | "risk-2" | "risk-3" | "risk-4" | "risk-5";

const RISK_TO_TOKEN: Record<NivelRisco, RiskLevel> = {
  conforme: "risk-1",
  baixo: "risk-2",
  medio: "risk-3",
  alto: "risk-4",
  critico: "risk-5",
};

const RISK_LABEL_PT: Record<NivelRisco, string> = {
  conforme: "Conforme",
  baixo: "Risco baixo",
  medio: "Risco médio",
  alto: "Risco alto",
  critico: "Risco crítico",
};

const RISK_CLASSES: Record<RiskLevel, string> = {
  "risk-1":
    "bg-[color-mix(in_srgb,var(--c-risk-1)_12%,var(--surface))] text-[color:var(--c-risk-1)] border-[color-mix(in_srgb,var(--c-risk-1)_35%,transparent)]",
  "risk-2":
    "bg-[color-mix(in_srgb,var(--c-risk-2)_14%,var(--surface))] text-[color:var(--c-risk-2)] border-[color-mix(in_srgb,var(--c-risk-2)_40%,transparent)]",
  "risk-3":
    "bg-[color-mix(in_srgb,var(--c-risk-3)_16%,var(--surface))] text-[color:var(--c-risk-3)] border-[color-mix(in_srgb,var(--c-risk-3)_40%,transparent)]",
  "risk-4":
    "bg-[color-mix(in_srgb,var(--c-risk-4)_14%,var(--surface))] text-[color:var(--c-risk-4)] border-[color-mix(in_srgb,var(--c-risk-4)_40%,transparent)]",
  "risk-5":
    "bg-[color-mix(in_srgb,var(--c-risk-5)_12%,var(--surface))] text-[color:var(--c-risk-5)] border-[color-mix(in_srgb,var(--c-risk-5)_40%,transparent)]",
};

const STATUS_TO_TOKEN: Record<StatusCaso, RiskLevel | "neutral" | "info"> = {
  candidato: "info",
  em_analise: "risk-3",
  aguardando_aprovacao: "risk-4",
  notificado: "risk-3",
  em_autorregularizacao: "risk-2",
  fiscalizacao: "risk-5",
  encerrado: "neutral",
};

const STATUS_LABEL_PT: Record<StatusCaso, string> = {
  candidato: "Candidato",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  notificado: "Notificado",
  em_autorregularizacao: "Em autorregularização",
  fiscalizacao: "Fiscalização",
  encerrado: "Encerrado",
};

const NEUTRAL_CLASSES = "bg-n-50 text-text-muted border-border";
const INFO_CLASSES =
  "bg-brand-050 text-brand-deep border-[color-mix(in_srgb,var(--c-brand)_18%,transparent)]";

type RiskProps = { kind: "risk"; level: NivelRisco; label?: string };
type StatusProps = { kind: "status"; status: StatusCaso; label?: string };
type ManualProps = {
  kind: "manual";
  tone: "risk-1" | "risk-2" | "risk-3" | "risk-4" | "risk-5" | "neutral" | "info";
  label: string;
};

type StatusBadgeProps = (RiskProps | StatusProps | ManualProps) &
  Omit<React.HTMLAttributes<HTMLSpanElement>, "children">;

function StatusBadge(props: StatusBadgeProps) {
  const { className, ...rest } = props as { className?: string };

  let tone: RiskLevel | "neutral" | "info";
  let label: string;

  if (props.kind === "risk") {
    tone = RISK_TO_TOKEN[props.level];
    label = props.label ?? RISK_LABEL_PT[props.level];
  } else if (props.kind === "status") {
    tone = STATUS_TO_TOKEN[props.status];
    label = props.label ?? STATUS_LABEL_PT[props.status];
  } else {
    tone = props.tone;
    label = props.label;
  }

  const toneClasses =
    tone === "neutral" ? NEUTRAL_CLASSES : tone === "info" ? INFO_CLASSES : RISK_CLASSES[tone];

  return (
    <span
      data-slot="status-badge"
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses,
        className,
      )}
      {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          tone === "risk-1" && "bg-[color:var(--c-risk-1)]",
          tone === "risk-2" && "bg-[color:var(--c-risk-2)]",
          tone === "risk-3" && "bg-[color:var(--c-risk-3)]",
          tone === "risk-4" && "bg-[color:var(--c-risk-4)]",
          tone === "risk-5" && "bg-[color:var(--c-risk-5)]",
          tone === "neutral" && "bg-n-400",
          tone === "info" && "bg-brand",
        )}
      />
      {label}
    </span>
  );
}

export { StatusBadge };
