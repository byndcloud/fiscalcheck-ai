import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import type { KpiTrend } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

import { Sparkline } from "./sparkline";

/*
  Card de KPI com tendência e sparkline (T17 · Painel do Gestor).
  Estende o layout do BigNumberCard do dashboard, adicionando a série
  visual de 4-12 pontos (recharts) e drill-down opcional para /cases
  quando o KPI faz sentido explorar por caso.

  Server Component compatível: só usa `next/link` + `Sparkline`
  (client via recharts). A ilha client fica isolada no gráfico.
*/

const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const BRL_FULL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});
const PCT_VAR = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

function formatValue(kpi: KpiTrend): string {
  switch (kpi.unidade) {
    case "brl":
      if (kpi.valor >= 1_000_000) {
        return `R$ ${BRL_COMPACT.format(kpi.valor)}`;
      }
      return BRL_FULL.format(kpi.valor);
    case "pct":
      return PCT.format(kpi.valor);
    case "score":
      return kpi.valor.toFixed(1);
    default:
      return NUM.format(kpi.valor);
  }
}

type KpiTrendCardProps = {
  kpi: KpiTrend;
  className?: string;
};

export function KpiTrendCard({ kpi, className }: KpiTrendCardProps) {
  const rose = kpi.variacaoPct >= 0;
  const isGood = kpi.positive ? rose : !rose;
  const TrendIcon = rose ? ArrowUpRightIcon : ArrowDownRightIcon;
  const trendColor = isGood ? "text-[#168821]" : "text-[#c5160b]";
  const trendBg = isGood ? "bg-[#e3f5e4]" : "bg-[#fbe0dd]";

  const inner = (
    <article
      className={cn(
        "group grid gap-3 rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]",
        "transition-shadow duration-200 hover:shadow-[0_6px_16px_-4px_rgba(16,24,40,0.10),0_2px_6px_rgba(16,24,40,0.06)]",
        kpi.drillDownHref ? "cursor-pointer" : undefined,
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#54607a]">
            {kpi.label}
          </p>
          {kpi.descricao ? (
            <p className="text-[11px] text-[#66718a] leading-tight">{kpi.descricao}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            trendBg,
            trendColor,
          )}
        >
          <TrendIcon aria-hidden="true" className="size-3" />
          {`${PCT_VAR.format(kpi.variacaoPct)}%`}
        </span>
      </header>

      <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#121826]">
        {formatValue(kpi)}
      </p>

      <div className="grid gap-1">
        <Sparkline
          data={kpi.serie}
          positive={isGood}
          ariaLabel={`Tendência de ${kpi.label} — últimos ${kpi.serie.length} pontos`}
        />
        {kpi.sub ? <p className="text-[11px] text-[#66718a]">{kpi.sub}</p> : null}
      </div>
    </article>
  );

  if (kpi.drillDownHref) {
    return (
      <Link
        href={kpi.drillDownHref as Route}
        aria-label={`Abrir fila filtrada por ${kpi.label}`}
        className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
