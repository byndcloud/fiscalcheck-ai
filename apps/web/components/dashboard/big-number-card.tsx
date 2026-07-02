import { ArrowDownRightIcon, ArrowUpRightIcon, type LucideIcon } from "lucide-react";

import type { KpiMoM } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Card "big number" com trend mês a mês.

  Semântica do trend:
   - `positive` = true quando um aumento é bom (recuperado, potencial recuperável);
   - `positive` = false quando um aumento é ruim (casos em aberto). Nesse caso
     invertemos a leitura da cor: variação percentual negativa vira sucesso.
*/

const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function formatKpiValue(kpi: KpiMoM): string {
  if (typeof kpi.valorBrl === "number") {
    if (kpi.valorBrl >= 1_000_000) {
      return `R$ ${(kpi.valorBrl / 1_000_000).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} mi`;
    }
    if (kpi.valorBrl >= 10_000) {
      return `R$ ${(kpi.valorBrl / 1_000).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      })} mil`;
    }
    return BRL_FULL.format(kpi.valorBrl);
  }
  if (typeof kpi.valorNumerico === "number") {
    return NUM.format(kpi.valorNumerico);
  }
  return "—";
}

const PCT_FMT = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

type BigNumberCardProps = {
  kpi: KpiMoM;
  /** Ícone decorativo, exibido em pastilha translúcida no canto superior direito. */
  icon: LucideIcon;
  /**
   * Cor institucional do tile do ícone e do halo. Aceita:
   *   `brand` (#1351B4) — Recuperado
   *   `success` (#168821) — Casos em aberto (queda é bom)
   *   `aurora` — Potencial recuperável (gradiente aurora)
   */
  accent: "brand" | "success" | "aurora";
  /**
   * Se true, aumentos são positivos (verde); se false, aumentos são negativos.
   * Padrão: true.
   */
  positive?: boolean;
};

const ACCENT_STYLES: Record<
  BigNumberCardProps["accent"],
  { tile: string; iconColor: string; ring: string }
> = {
  brand: {
    tile: "bg-[#eaf1fb]",
    iconColor: "text-[#1351b4]",
    ring: "ring-[#c5d4f0]",
  },
  success: {
    tile: "bg-[#e3f5e4]",
    iconColor: "text-[#168821]",
    ring: "ring-[#c8ecca]",
  },
  aurora: {
    tile: "bg-[image:var(--grad-aurora)] text-white",
    iconColor: "text-white",
    ring: "ring-white/40",
  },
};

export function BigNumberCard({ kpi, icon: Icon, accent, positive = true }: BigNumberCardProps) {
  const styles = ACCENT_STYLES[accent];
  const value = formatKpiValue(kpi);

  const variacao = kpi.variacaoPercentual;
  const rose = variacao >= 0;
  const isGoodTrend = positive ? rose : !rose;
  const trendColor = isGoodTrend ? "text-[#168821]" : "text-[#c5160b]";
  const trendBg = isGoodTrend ? "bg-[#e3f5e4]" : "bg-[#fbe0dd]";
  const TrendIcon = rose ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]">
      <header className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#54607a]">
          {kpi.label}
        </p>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
            styles.tile,
            styles.ring,
          )}
        >
          <Icon className={cn("size-[18px]", styles.iconColor)} />
        </span>
      </header>

      <p className="font-display text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[#121826]">
        {value}
      </p>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            trendBg,
            trendColor,
          )}
        >
          <TrendIcon aria-hidden="true" className="size-3" />
          {`${PCT_FMT.format(variacao)}%`}
        </span>
        {kpi.sub ? <span className="text-[11px] text-[#66718a]">{kpi.sub}</span> : null}
      </div>
    </article>
  );
}
