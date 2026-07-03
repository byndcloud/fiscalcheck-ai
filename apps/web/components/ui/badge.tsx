import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Badge genérico (docs/design-system/design-system.md §7).
  Variantes semânticas alinhadas aos tokens de superfície.
  Foco visível e estado aria-invalid herdam o padrão shadcn/DS para permitir
  uso em botões/links (asChild) e em campos de formulário.
*/
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-primary-foreground",
        secondary: "border-transparent bg-brand-050 text-brand-deep",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-[color-mix(in_srgb,var(--c-success)_12%,var(--surface))] text-success",
        warning:
          "border-transparent bg-[color-mix(in_srgb,var(--c-warning)_16%,var(--surface))] text-[color:var(--c-warning)]",
        danger:
          "border-transparent bg-[color-mix(in_srgb,var(--c-danger)_10%,var(--surface))] text-destructive",
        info: "border-transparent bg-brand-050 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({ className, variant = "default", asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
