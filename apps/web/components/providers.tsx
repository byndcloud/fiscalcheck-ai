"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { notify } from "@/lib/toast";
import { isMswEnabled, startMockingIfEnabled } from "@/mocks/enable";

/*
  Tratamento GLOBAL de erro (T25 · módulo transversal).

  - `queryCache.onError`: toda leitura falha vira toast, a menos que o
    consumidor sinalize `meta.silent = true` (páginas que preferem
    renderizar o próprio ErrorState inline e evitar toast redundante).
  - `mutationCache.onError`: escrita falha SEMPRE vira toast global —
    exceto quando o consumidor sinaliza `meta.silent = true` porque
    já mostra `toast.error` local com contexto extra (ex: mutations
    do módulo 4 que precisam informar o casoId no toast).

  Mensagens amigáveis pt-BR vêm de `lib/errors.ts`; nenhum consumidor
  precisa lidar com ApiError.code/status/correlationId.
*/

// Aliases para o `meta` do TanStack Query (evita passar `unknown` para
// checagens de flag em cada handler).
type QueryMeta = { silent?: boolean };
type MutationMeta = { silent?: boolean; toastSuccess?: string };

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const meta = query.meta as QueryMeta | undefined;
            if (meta?.silent) return;
            notify.apiError(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            const meta = mutation.meta as MutationMeta | undefined;
            if (meta?.silent) return;
            notify.apiError(error);
          },
          onSuccess: (_data, _variables, _context, mutation) => {
            const meta = mutation.meta as MutationMeta | undefined;
            if (meta?.toastSuccess) {
              notify.success(meta.toastSuccess);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const [mockReady, setMockReady] = useState(!isMswEnabled());

  useEffect(() => {
    if (mockReady) return;
    let cancelled = false;
    startMockingIfEnabled().then(() => {
      if (!cancelled) setMockReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mockReady]);

  return (
    <QueryClientProvider client={queryClient}>
      {mockReady ? (
        children
      ) : (
        <output
          aria-live="polite"
          className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground"
        >
          Inicializando camada de mock…
        </output>
      )}
      <Toaster />
      {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
