import { GraduationCapIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  Faixa âmbar do Ambiente de Treinamento (T20 · RSC04 · módulo 6).

  Sinalização permanente para o auditor em formação nunca confundir o
  exercício com o ambiente real. Usa o token --c-warning (âmbar gov.br)
  com texto em --c-risk-3-txt para garantir contraste ≥ 4.5:1 sobre a
  tinta clara (o amarelo puro não passa em fundo claro).
*/

type TrainingBannerProps = {
  className?: string;
  compact?: boolean;
};

export function TrainingBanner({ className, compact = false }: TrainingBannerProps) {
  return (
    <div
      role="note"
      aria-label="Ambiente de treinamento com dados anonimizados"
      className={cn(
        "flex items-start gap-3 rounded-[var(--r-md)] border border-[color:var(--c-warning)]/60",
        "bg-[color-mix(in_srgb,var(--c-warning)_14%,var(--surface))]",
        compact ? "p-2.5" : "p-3.5",
        className,
      )}
    >
      <GraduationCapIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-[color:var(--c-risk-3-txt)]"
      />
      <div className="grid gap-0.5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[color:var(--c-risk-3-txt)]">
          Ambiente de treinamento · dados anonimizados
        </p>
        {!compact ? (
          <p className="text-xs text-text-strong">
            Contribuintes identificados por codinome e CNPJs mascarados. Nenhuma decisão tomada aqui
            gera efeito sobre casos reais, notificações ou trilha de auditoria.
          </p>
        ) : null}
      </div>
    </div>
  );
}
