import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Textarea (docs/design-system/design-system.md §7).
  - Mesmos tokens do Input (borda --n-300, raio --r-sm, halo brand-050).
  - Altura mínima 80px; permite auto-grow via `rows`.
  - aria-invalid propaga cor de erro (halo --c-danger).
*/
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-sm border border-input bg-surface px-3 py-2 text-base text-foreground shadow-[var(--e-1)] transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-050",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
