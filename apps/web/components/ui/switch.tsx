"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Switch (docs/design-system/design-system.md §7).
  - Pílula 40x22 px; ON: --c-brand · OFF: --n-300.
  - Thumb branco 18px com sombra --e-1 e transição 220ms (--dur).
  - Foco: anel 3px --c-brand-300 offset 2px (padrão DS de foco visível).
*/

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-brand data-[state=unchecked]:bg-n-300",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[18px] rounded-full bg-surface shadow-[var(--e-1)] ring-0",
          "transition-transform",
          "data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
