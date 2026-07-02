/*
  Bootstrap idempotente da camada MSW.

  Ativa apenas se `NEXT_PUBLIC_MSW_ENABLED === "true"`. O worker é iniciado
  uma única vez por sessão do browser (guardado num Promise em módulo).
  Se falhar a inicialização, a promise é rejeitada e o consumidor decide
  seguir sem mock (log em console.warn — nunca lançamos aqui).
*/

let startPromise: Promise<void> | null = null;

export function isMswEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MSW_ENABLED === "true";
}

export function startMockingIfEnabled(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!isMswEnabled()) return Promise.resolve();
  if (startPromise) return startPromise;

  startPromise = (async () => {
    try {
      const { worker } = await import("./browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });
      if (process.env.NODE_ENV !== "test") {
        console.info("[MSW] Camada de mock ativa. Desative com NEXT_PUBLIC_MSW_ENABLED=false.");
      }
    } catch (error) {
      console.warn("[MSW] Falha ao iniciar o worker de mock:", error);
    }
  })();

  return startPromise;
}
