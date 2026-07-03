"use client";

import { LayoutGridIcon, ListIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CaseView = "kanban" | "lista";

/*
  Toggle segmentado Kanban ↔ Lista (T13). Só troca a apresentação do
  mesmo dataset — nenhuma decisão passa por aqui, então zero risco de
  quebrar a cadeia decisória.
*/
type Props = {
  mode: CaseView;
  onModeChange: (mode: CaseView) => void;
  className?: string;
};

const OPTIONS: { value: CaseView; label: string; Icon: typeof LayoutGridIcon }[] = [
  { value: "kanban", label: "Kanban", Icon: LayoutGridIcon },
  { value: "lista", label: "Lista", Icon: ListIcon },
];

export function ViewToggle({ mode, onModeChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Visualização dos casos"
      className={cn(
        "inline-flex rounded-full border border-border bg-surface p-0.5 shadow-[var(--e-1)]",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--e-1)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
