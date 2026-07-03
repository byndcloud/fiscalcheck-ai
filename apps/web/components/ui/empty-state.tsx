import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Empty state (docs/design-system/design-system.md §8).
  Ícone lucide + título + descrição em pt-BR + slot opcional de ação.
*/

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-n-200 bg-surface/60 p-10 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-050 text-brand">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <div className="grid gap-1">
        <h3 className="text-base font-semibold text-text-strong">{title}</h3>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
