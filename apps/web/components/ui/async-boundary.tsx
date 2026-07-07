import { Loader2Icon } from "lucide-react";
import type * as React from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — AsyncBoundary (T25 · docs/design-system §7).

  Componente utilitário que evita o mesmo if/else se repetindo em toda
  tela que fetcha dado com TanStack Query. Recebe as flags e o dado,
  decide sozinho qual estado renderizar (loading > erro > vazio >
  sucesso) e delega os slots.

  Contrato:

    <AsyncBoundary
      isLoading={q.isPending}
      isError={q.isError}
      error={q.error}
      isEmpty={data.length === 0}
      onRetry={q.refetch}
      loading={<SkeletonTable ... />}
      empty={<EmptyState ... />}
    >
      <MinhaLista data={data} />
    </AsyncBoundary>

  Todas as slots são opcionais — quando ausentes, caem em defaults
  seguros (spinner + `ErrorState` padrão + `EmptyState` padrão).
*/

type AsyncBoundaryProps = {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Slot de loading — se omitido, mostra um spinner + texto. */
  loading?: React.ReactNode;
  /** Slot custom para erro — se omitido, usa `<ErrorState error onRetry />`. */
  errorSlot?: React.ReactNode;
  /** Slot custom para vazio — se omitido, usa `<EmptyState />`. */
  empty?: React.ReactNode;
  /** Estados de sucesso (dados renderizados). */
  children: React.ReactNode;
  className?: string;
};

function AsyncBoundary({
  isLoading,
  isError,
  isEmpty = false,
  error,
  onRetry,
  loading,
  errorSlot,
  empty,
  children,
  className,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return (
      <div data-slot="async-boundary" data-state="loading" className={className}>
        {loading ?? <DefaultLoading />}
      </div>
    );
  }

  if (isError) {
    return (
      <div data-slot="async-boundary" data-state="error" className={className}>
        {errorSlot ?? <ErrorState error={error} onRetry={onRetry} />}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div data-slot="async-boundary" data-state="empty" className={className}>
        {empty ?? (
          <EmptyState
            title="Nada por aqui ainda"
            description="Quando novos dados aparecerem, você verá o registro nesta lista."
          />
        )}
      </div>
    );
  }

  /*
    `contents`: no estado de sucesso o wrapper não gera caixa própria —
    os filhos participam do grid/flex do pai e herdam o `gap` da página.
    Sem isso, telas que passam várias seções como children (ex.: Análise
    de Redes, Geofiscalização) ficavam com as seções coladas entre si.
  */
  return (
    <div data-slot="async-boundary" data-state="ready" className={cn("contents", className)}>
      {children}
    </div>
  );
}

function DefaultLoading() {
  return (
    <output
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
    >
      <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
      Carregando…
    </output>
  );
}

export { AsyncBoundary };
export type { AsyncBoundaryProps };
