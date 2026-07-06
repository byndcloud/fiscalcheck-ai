import { ClockIcon } from "lucide-react";

import { prazoInfo } from "@/lib/prazo";
import { cn } from "@/lib/utils";

/*
  Chip de prazo com contagem regressiva (T14).
  Âmbar quando o vencimento se aproxima (≤3d), vermelho quando vence
  hoje ou já venceu — mesmo critério da fila (lib/prazo.ts).
*/

const TONE_CLASS: Record<ReturnType<typeof prazoInfo>["tone"], string> = {
  muted: "border-border bg-n-25 text-muted-foreground",
  warn: "border-[color:var(--c-risk-3)]/50 bg-[color-mix(in_srgb,var(--c-risk-3)_12%,var(--surface))] text-[color:var(--c-risk-3-txt)]",
  danger:
    "border-[color:var(--c-risk-5)]/50 bg-[color-mix(in_srgb,var(--c-risk-5)_10%,var(--surface))] text-[color:var(--c-risk-5-txt)]",
};

export function CaseDeadlineChip({
  prazoLimite,
  className,
}: {
  prazoLimite?: string;
  className?: string;
}) {
  const info = prazoInfo(prazoLimite);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-semibold",
        TONE_CLASS[info.tone],
        className,
      )}
    >
      <ClockIcon aria-hidden="true" className="size-3.5" />
      {info.label}
      {prazoLimite ? (
        <span className="font-data font-normal opacity-80">
          · {new Date(`${prazoLimite}T12:00:00`).toLocaleDateString("pt-BR")}
        </span>
      ) : null}
    </span>
  );
}
