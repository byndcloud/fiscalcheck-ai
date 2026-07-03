import { ShieldCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Pill "LGPD · pseudonimizado". Usada em SourceCard, drawer de carga
  e no header da página para reforçar que dados sigilosos (CPF/CNPJ,
  valores declarados) são pseudonimizados antes de persistência.

  Aparece no header sempre; nas fontes/cargas condicional a
  `pseudonimizado: true`.
*/
type LgpdBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function LgpdBadge({ className, compact = false }: LgpdBadgeProps) {
  return (
    <span
      data-slot="lgpd-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--c-aurora-to)]/40 bg-[color:var(--c-aurora-to)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--c-aurora-from)]",
        compact && "px-2 py-0.5 text-[10px]",
        className,
      )}
    >
      <ShieldCheckIcon aria-hidden="true" className={compact ? "size-3" : "size-3.5"} />
      LGPD · pseudonimizado
    </span>
  );
}
