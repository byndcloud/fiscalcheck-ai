"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { isMswEnabled, startMockingIfEnabled } from "@/mocks/enable";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
