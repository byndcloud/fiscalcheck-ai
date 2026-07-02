"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Label (docs/design-system/design-system.md §4).
  Peso 500 / cor --t-strong para casar com Input.
*/
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm font-medium leading-none text-text-strong select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
