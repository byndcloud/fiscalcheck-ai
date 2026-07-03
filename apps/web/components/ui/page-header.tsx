import type * as React from "react";

import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — Page Header (docs/design-system/design-system.md §8).
  Título + subtítulo + slot de ação + breadcrumb opcional.
  Colocar no topo de cada rota /(dashboard)/*.
*/

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

function PageHeader({ title, description, breadcrumb, action, className }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-col gap-3 border-b border-border pb-5", className)}
    >
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="font-display text-2xl font-semibold leading-tight text-text-strong">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}

export { PageHeader };
