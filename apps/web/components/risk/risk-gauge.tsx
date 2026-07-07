"use client";

import { useEffect, useId, useState } from "react";

import type { NivelRisco } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Medidor de score — assinatura visual do FiscalCheck DS (§8) — T08 · módulo 3 · RF03.

  SVG puro (sem lib de chart): o medidor é o objeto mais memorável do
  sistema e precisa reproduzir a spec ao pixel — semicírculo 180° com o
  gradiente de risco contínuo (§3.3), trilha neutra por baixo, ponteiro
  com pivô escuro e ponta na cor do nível, número central em Montserrat
  48/800 na cor do nível e extremos da escala em Roboto Mono 10px.

  Entrada animada: arco e ponteiro partem do zero e transicionam ao valor
  real via CSS (`--dur-slow` / `--ease-ds`); a supressão por
  prefers-reduced-motion já é global (globals.css §base) — não duplicar.
*/

const NIVEL_TO_COLOR: Record<NivelRisco, string> = {
  conforme: "var(--c-risk-1)",
  baixo: "var(--c-risk-2)",
  medio: "var(--c-risk-3)",
  alto: "var(--c-risk-4)",
  critico: "var(--c-risk-5)",
};

const NIVEL_LABEL_PT: Record<NivelRisco, string> = {
  conforme: "conforme",
  baixo: "baixo",
  medio: "médio",
  alto: "alto",
  critico: "crítico",
};

/* Paradas do gradiente de risco contínuo — DS §3.3 (medidor de score). */
const GRADIENT_STOPS = [
  { offset: "0%", color: "#168821" },
  { offset: "28%", color: "#7FB23C" },
  { offset: "56%", color: "#F2A900" },
  { offset: "80%", color: "#E8590C" },
  { offset: "100%", color: "#C5160B" },
] as const;

const WIDTH = 240;
const HEIGHT = 152;
const CX = 120;
const CY = 118;
const RADIUS = 86;
const STROKE = 22;
const ARC_LENGTH = Math.PI * RADIUS;
const NEEDLE_LENGTH = 58;

type RiskGaugeProps = {
  valor: number;
  nivel: NivelRisco;
  className?: string;
};

export function RiskGauge({ valor, nivel, className }: RiskGaugeProps) {
  const gradientId = useId();
  const clamped = Math.min(100, Math.max(0, valor));
  const color = NIVEL_TO_COLOR[nivel];

  /*
    O estado `entered` dispara a transição de entrada após o primeiro
    paint: arco e ponteiro saem do zero e assentam no valor real.
  */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const progress = entered ? clamped / 100 : 0;
  const dashOffset = ARC_LENGTH * (1 - progress);
  const needleAngle = progress * 180 - 90;

  const arcPath = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

  return (
    <div
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score de risco: ${Math.round(clamped)} de 100 — nível ${NIVEL_LABEL_PT[nivel]}`}
      className={cn("inline-flex flex-col items-center", className)}
    >
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {GRADIENT_STOPS.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        {/* Trilha neutra por baixo do arco de progresso */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--n-100)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Arco de progresso com o gradiente de risco contínuo */}
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset var(--dur-slow) var(--ease-ds)",
          }}
        />

        {/* Número central — Montserrat 48/800 na cor do nível (DS §4) */}
        <text
          x={CX}
          y={CY - 14}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize={48}
          fontWeight={800}
          letterSpacing="-1"
          fill={color}
        >
          {Math.round(clamped)}
        </text>

        {/* Ponteiro — pivô escuro, ponta colorida pelo nível */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform var(--dur-slow) var(--ease-ds)",
          }}
        >
          <line
            x1={CX}
            y1={CY - 8}
            x2={CX}
            y2={CY - NEEDLE_LENGTH}
            stroke="var(--n-800)"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY - NEEDLE_LENGTH} r={4.5} fill={color} />
        </g>
        <circle cx={CX} cy={CY} r={7} fill="var(--n-800)" />
        <circle cx={CX} cy={CY} r={2.5} fill="var(--n-0)" />

        {/* Extremos da escala — Roboto Mono 10px (DS §4) */}
        <text
          x={CX - RADIUS}
          y={HEIGHT - 10}
          textAnchor="middle"
          fontFamily="var(--font-data)"
          fontSize={10}
          fill="var(--t-muted)"
        >
          0
        </text>
        <text
          x={CX + RADIUS}
          y={HEIGHT - 10}
          textAnchor="middle"
          fontFamily="var(--font-data)"
          fontSize={10}
          fill="var(--t-muted)"
        >
          100
        </text>

        {/* Legenda sob o número */}
        <text
          x={CX}
          y={HEIGHT - 10}
          textAnchor="middle"
          fontFamily="var(--font-ui)"
          fontSize={11}
          fill="var(--t-muted)"
        >
          de 100 · prioridade
        </text>
      </svg>
    </div>
  );
}
