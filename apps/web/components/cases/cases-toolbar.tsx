"use client";

import { SearchIcon } from "lucide-react";

import { type CaseView, ViewToggle } from "@/components/cases/view-toggle";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/*
  Barra de controles compartilhada da fila de casos (T13).

  Fica logo abaixo do PageHeader — sempre visível independente do modo
  (Kanban ou Lista). Filtro global e toggle vivem aqui para dar controle
  consistente em ambas as visões.
*/

type Props = {
  view: CaseView;
  onViewChange: (view: CaseView) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  total: number;
  visible: number;
  className?: string;
};

export function CasesToolbar({
  view,
  onViewChange,
  filter,
  onFilterChange,
  total,
  visible,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 shadow-[var(--e-1)]",
        className,
      )}
      role="toolbar"
      aria-label="Controles da fila de casos"
    >
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Filtrar casos"
            placeholder="Buscar por ID, contribuinte, status ou recomendação…"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            className="pl-9"
          />
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {visible === total ? (
            <>
              <strong className="font-mono text-text-strong">{total}</strong> casos
            </>
          ) : (
            <>
              <strong className="font-mono text-text-strong">{visible}</strong> de {total} casos
            </>
          )}
        </span>
      </div>
      <ViewToggle mode={view} onModeChange={onViewChange} />
    </div>
  );
}
