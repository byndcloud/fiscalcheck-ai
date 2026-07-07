"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { NivelRisco, ScoreHistoricoPonto } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Evolução do score no tempo — T08 · módulo 3 · RF03.

  A série carrega `modeloVersao` em cada ponto porque a versão do modelo
  mudou ao longo do período: o tooltip precisa expor isso para manter a
  rastreabilidade de auditoria (reprodutibilidade do score — AGENTS.md).
  Linha/área na cor do nível ATUAL (último ponto), usando os tokens do
  espectro de risco (DS §3.3) — nunca hue avulso.
*/

const NIVEL_TO_COLOR: Record<NivelRisco, string> = {
  conforme: "var(--c-risk-1)",
  baixo: "var(--c-risk-2)",
  medio: "var(--c-risk-3)",
  alto: "var(--c-risk-4)",
  critico: "var(--c-risk-5)",
};

const MONTH_FMT = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });
const FULL_DATE_FMT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

/* Datas ISO só-data são ancoradas no fuso local para não recuar um dia (UTC-3). */
function toLocalDate(isoDate: string): Date {
  return isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
}

function monthLabel(isoDate: string): string {
  return MONTH_FMT.format(toLocalDate(isoDate)).replace(/\./g, "");
}

type ChartPoint = ScoreHistoricoPonto & { label: string };

type HistoryTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartPoint }>;
};

function HistoryTooltip({ active, payload }: HistoryTooltipProps) {
  const ponto = payload?.[0]?.payload;
  if (!active || !ponto) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-[var(--e-2)]">
      <p className="font-semibold text-text-strong">
        {FULL_DATE_FMT.format(toLocalDate(ponto.data))}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        Score: <span className="font-data font-semibold text-text-strong">{ponto.valor}</span> de
        100
      </p>
      <p className="mt-0.5 font-data text-[10px] text-muted-foreground">
        Modelo {ponto.modeloVersao}
      </p>
    </div>
  );
}

type ScoreHistoryChartProps = {
  historico: ScoreHistoricoPonto[];
  className?: string;
};

export function ScoreHistoryChart({ historico, className }: ScoreHistoryChartProps) {
  const gradientId = useId();

  if (historico.length < 2) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Ainda não há histórico suficiente para exibir a evolução do score.
      </p>
    );
  }

  const data: ChartPoint[] = historico.map((ponto) => ({
    ...ponto,
    label: monthLabel(ponto.data),
  }));
  const first = data[0];
  const last = data[data.length - 1];
  const lastIndex = data.length - 1;
  const color = last ? NIVEL_TO_COLOR[last.nivel] : "var(--c-risk-3)";

  const ariaLabel =
    first && last
      ? `Evolução do score de risco: de ${first.valor} pontos em ${first.label} para ${last.valor} pontos em ${last.label}.`
      : "Evolução do score de risco.";

  /* Dot só no último ponto — destaca o score vigente sem poluir a série. */
  const renderDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props;
    if (index !== lastIndex || cx === undefined || cy === undefined) {
      return <g key={`score-dot-${index ?? "vazio"}`} />;
    }
    return (
      <circle
        key={`score-dot-${index}`}
        cx={cx}
        cy={cy}
        r={4.5}
        fill={color}
        stroke="var(--surface)"
        strokeWidth={2}
      />
    );
  };

  return (
    <div role="img" aria-label={ariaLabel} className={cn("h-56 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--n-100)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--n-500)" />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11 }}
            stroke="var(--n-500)"
          />
          <Tooltip content={<HistoryTooltip />} />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={renderDot}
            activeDot={{ r: 5, fill: color, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
