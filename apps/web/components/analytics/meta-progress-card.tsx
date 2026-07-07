import { AlertTriangleIcon, CheckCircle2Icon, ChevronRightIcon, GaugeIcon } from "lucide-react";

import type { MetaPiloto, MetaStatus } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Card de meta do piloto (T17). Mostra baseline → atual / alvo, barra
  de progresso pintada pelo status semântico (verde/âmbar/vermelho) e
  botão opcional de ação (`children`) — usado tanto para "Responder
  SUS" na meta de usabilidade quanto para futuras interações.

  A cor da barra segue o espectro semântico de operação (success /
  warning / destructive), NÃO o espectro de risco — o espectro de
  risco é reservado ao score do contribuinte (DS v2.0 §3).
*/

const STATUS_META: Record<
  MetaStatus,
  {
    label: string;
    icon: typeof CheckCircle2Icon;
    tone: string;
    bar: string;
    ring: string;
  }
> = {
  no_alvo: {
    label: "No alvo",
    icon: CheckCircle2Icon,
    tone: "text-[#0f5e18] bg-[#e3f5e4]",
    bar: "bg-[#168821]",
    ring: "ring-[#c8ecca]",
  },
  em_risco: {
    label: "Em risco",
    icon: AlertTriangleIcon,
    tone: "text-[#9a7700] bg-[#fff5cf]",
    bar: "bg-[#f2a900]",
    ring: "ring-[#f5db8c]",
  },
  critico: {
    label: "Crítico",
    icon: AlertTriangleIcon,
    tone: "text-[#c5160b] bg-[#fbe0dd]",
    bar: "bg-[#c5160b]",
    ring: "ring-[#f4bdb8]",
  },
};

const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});
const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function formatMetaValue(value: number, unidade: MetaPiloto["unidade"]): string {
  if (unidade === "pct") return PCT.format(value);
  if (unidade === "score") return value.toFixed(1);
  return NUM.format(value);
}

type MetaProgressCardProps = {
  meta: MetaPiloto;
  children?: React.ReactNode;
};

export function MetaProgressCard({ meta, children }: MetaProgressCardProps) {
  const status = STATUS_META[meta.status];
  const StatusIcon = status.icon;
  const progressPct = Math.round(meta.progressoPct * 100);

  return (
    <article
      className={cn(
        "grid gap-4 rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]",
      )}
      aria-labelledby={`meta-${meta.id}-title`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p
            id={`meta-${meta.id}-title`}
            className="text-[13px] font-semibold text-[#121826] leading-tight"
          >
            {meta.nome}
          </p>
          <p className="text-[11px] text-[#66718a] leading-snug">{meta.descricao}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
            status.tone,
            status.ring,
          )}
        >
          <StatusIcon aria-hidden="true" className="size-3" />
          {status.label}
        </span>
      </header>

      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#121826]">
              {formatMetaValue(meta.atual, meta.unidade)}
            </span>
            <span className="text-[12px] text-[#66718a]">
              / {formatMetaValue(meta.alvo, meta.unidade)}
            </span>
          </div>
          <span className="font-data text-[12px] font-semibold text-[#54607a]">{progressPct}%</span>
        </div>

        {/* biome-ignore lint/a11y/useFocusableInteractive: progressbar por spec ARIA é elemento de status, não interativo — não deve receber foco por teclado. */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label={`Progresso da meta ${meta.nome}`}
          className="relative h-2 w-full overflow-hidden rounded-full bg-[#eef2f8]"
        >
          <div
            className={cn("h-full transition-[width]", status.bar)}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <dl className="flex items-center gap-4 text-[11px] text-[#66718a]">
          <div className="flex items-center gap-1">
            <GaugeIcon aria-hidden="true" className="size-3" />
            <dt className="sr-only">Baseline</dt>
            <dd>Baseline {formatMetaValue(meta.baseline, meta.unidade)}</dd>
          </div>
          <div>
            <dt className="sr-only">Prazo</dt>
            <dd>Prazo {DATE.format(new Date(meta.prazoEm))}</dd>
          </div>
        </dl>

        {/* Metodologia oficial de aferição (TR 7.2) — colapsada por padrão. */}
        {meta.afericaoTR ? (
          <details className="group rounded-lg border border-[#e1e6f0] bg-[#f8fafd]">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#54607a] [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon
                aria-hidden="true"
                className="size-3 transition-transform group-open:rotate-90"
              />
              Como é aferida · {meta.afericaoTR.referencia}
            </summary>
            <div className="grid gap-2 border-t border-[#e1e6f0] px-3 py-2.5">
              <p className="font-data text-[11px] leading-snug text-[#121826]">
                {meta.afericaoTR.formula}
              </p>
              <p className="text-[11px] leading-snug text-[#66718a]">{meta.afericaoTR.metodo}</p>
            </div>
          </details>
        ) : null}
      </div>

      {children ? <footer className="pt-1">{children}</footer> : null}
    </article>
  );
}
