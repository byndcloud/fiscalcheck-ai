import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Botão (docs/design-system/design-system.md §7).
  - Formato pílula (rounded-full ≙ --r-pill) em todas as variantes.
  - Foco visível obrigatório: anel 3px em --c-brand-300, offset 2px.
  - `default` (primário institucional) → ações de efeito jurídico (RF04/FA04).
  - `aurora` → exclusivo de recursos de IA (Copilot, esteira de agentes).
    Carrega o gradiente --grad-aurora e nunca substitui o primário em
    ações fiscais — sinaliza "produzido ou assistido por IA".
*/
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-brand-300 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-hover shadow-[var(--e-1)]",
        secondary: "border border-brand bg-transparent text-brand hover:bg-brand-050",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-brand hover:bg-brand-050",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive/40",
        aurora:
          "bg-[image:var(--grad-aurora)] text-white shadow-[var(--e-2)] hover:brightness-110 focus-visible:ring-aurora-to",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-3 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-10 px-6 has-[>svg]:px-5",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
