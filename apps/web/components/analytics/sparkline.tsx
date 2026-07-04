"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

/*
  Sparkline mínimo (60x24 no cabeçalho de um KpiTrendCard).
  Envolve `AreaChart` da recharts sem eixos/labels/legenda.
  Reduce motion: `isAnimationActive={false}` respeita a preferência
  global do usuário (@layer base já cuida disso globalmente).
*/

type SparklineProps = {
  data: readonly number[];
  positive: boolean;
  height?: number;
  ariaLabel?: string;
};

export function Sparkline({ data, positive, height = 32, ariaLabel }: SparklineProps) {
  const stroke = positive ? "var(--c-success, #168821)" : "var(--c-risk-5, #C5160B)";
  const gradientId = `sparkline-fill-${positive ? "positive" : "negative"}`;

  const chartData = data.map((value, i) => ({ i, value }));

  return (
    <div className="w-full" style={{ height }} aria-label={ariaLabel} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
