import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Skeleton (T25 · docs/design-system §7).
  Base tingida em --n-100 com pulse Tailwind. Respeita
  `prefers-reduced-motion` via regra global em globals.css (§6 do DS).

  Variantes prontas para os padrões mais comuns:
   · SkeletonText   — bloco de texto (1..N linhas)
   · SkeletonCard   — bloco cinza com padding e altura de card
   · SkeletonRow    — linha de tabela (respeita colunas)
*/

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-n-100", className)}
      {...props}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const count = Math.max(1, Math.min(lines, 8));
  return (
    <div className={cn("grid gap-2", className)} aria-hidden="true" data-slot="skeleton-text">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: chaves estáveis por índice (linhas do skeleton)
          key={i}
          className={cn("h-3", i === count - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

type SkeletonCardProps = {
  height?: string;
  className?: string;
};

function SkeletonCard({ height = "h-32", className }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton-card"
      className={cn(
        "grid gap-3 rounded-2xl border border-border bg-surface p-5 shadow-[var(--e-1)]",
        height,
        className,
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

type SkeletonRowProps = {
  columns?: number;
  className?: string;
};

function SkeletonRow({ columns = 4, className }: SkeletonRowProps) {
  const cols = Math.max(2, Math.min(columns, 10));
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton-row"
      className={cn("grid items-center gap-4 border-b border-border px-4 py-3", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: chaves estáveis por índice (colunas do skeleton)
          key={i}
          className={cn("h-3", i === 0 ? "w-3/4" : "w-1/2")}
        />
      ))}
    </div>
  );
}

type SkeletonTableProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  const count = Math.max(1, Math.min(rows, 20));
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton-table"
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface shadow-[var(--e-1)]",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas do skeleton são estáveis por índice
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonTable, SkeletonText };
