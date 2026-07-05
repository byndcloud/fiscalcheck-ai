import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { resolveErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/*
  FiscalCheck DS — ErrorState (T25 · docs/design-system §7).
  Estado de erro inline dentro do fluxo — não confundir com toast.
  Toast comunica o *evento* (falhou, salvou, exportou); ErrorState
  ocupa o *lugar* que o conteúdo deveria ocupar quando a leitura
  falha e ainda dá `Tentar novamente`.

  Regra pt-BR: nunca aceita `error.message` cru no corpo. Se o
  consumidor passar `error`, resolvemos aqui via `resolveErrorMessage`
  (mesmo mapa do toast global — ver lib/errors.ts).
*/

type ErrorStateProps = {
  /**
   * Erro cru (ApiError, Error, unknown). Se passado, extraímos
   * título e descrição pt-BR via `resolveErrorMessage`.
   */
  error?: unknown;
  /** Sobrescreve o título — quando o consumidor sabe melhor do que o mapa. */
  title?: string;
  /** Sobrescreve a descrição. */
  description?: string;
  /**
   * Handler do botão "Tentar novamente". Se omitido, o botão
   * some — casos em que retry não faz sentido (403/404, etc.).
   */
  onRetry?: () => void;
  /** Slot para ações extras (ex: "Voltar", "Falar com suporte"). */
  action?: React.ReactNode;
  className?: string;
};

function ErrorState({ error, title, description, onRetry, action, className }: ErrorStateProps) {
  const resolved = error !== undefined ? resolveErrorMessage(error) : undefined;
  const finalTitle = title ?? resolved?.title ?? "Não foi possível carregar";
  const finalDescription = description ?? resolved?.description ?? "Tente novamente em instantes.";

  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon aria-hidden="true" className="size-6" />
      </div>
      <div className="grid gap-1">
        <h3 className="text-base font-semibold text-text-strong">{finalTitle}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{finalDescription}</p>
        {resolved?.correlationId ? (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">
            Código de rastreamento: {resolved.correlationId.slice(-12)}
          </p>
        ) : null}
      </div>
      {onRetry || action ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCwIcon aria-hidden="true" />
              Tentar novamente
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
