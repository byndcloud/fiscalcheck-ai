"use client";

import type { PanelManagerPeriodo } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Segmented control com os 4 períodos do Painel do Gestor (T17).
  Client component porque muda estado local por interação. Anúncio
  ao leitor de tela: role="group" + aria-labelledby oculto.
*/

const OPTIONS: readonly { value: PanelManagerPeriodo; label: string }[] = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "trimestre", label: "Trimestre" },
  { value: "ano", label: "Ano" },
];

type PeriodFilterProps = {
  value: PanelManagerPeriodo;
  onChange: (value: PanelManagerPeriodo) => void;
  className?: string;
};

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: segmented control é um grupo semântico com botões toggle (aria-pressed) — `<fieldset>` traria estilos indesejados e semântica de form; o `role="group"` é o pattern correto aqui.
    <div
      role="group"
      aria-label="Filtro de período do painel"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-[#e1e6f0] bg-white p-0.5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2",
              selected
                ? "bg-[#1351b4] text-white shadow-[0_1px_2px_rgba(19,81,180,0.25)]"
                : "text-[#54607a] hover:bg-[#f4f6fb]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
