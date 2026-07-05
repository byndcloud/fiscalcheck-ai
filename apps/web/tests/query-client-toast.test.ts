import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

/*
  T25 — Wiring do QueryClient global com o toast.

  Não montamos <Providers/> (ele bootstraps MSW). Recriamos aqui a
  MESMA fábrica de QueryClient para validar o contrato:

    · queryCache.onError chama notify.apiError, exceto com meta.silent
    · mutationCache.onError chama notify.apiError, exceto com meta.silent
    · mutationCache.onSuccess dispara notify.success quando
      `meta.toastSuccess` está setado

  Se algum dia migrarmos o QueryClient para um módulo exportável, aqui
  vale a pena importar dele em vez de replicar a config.
*/

const apiErrorMock = vi.fn();
const successMock = vi.fn();

vi.mock("@/lib/toast", () => ({
  notify: {
    apiError: (...args: unknown[]) => apiErrorMock(...args),
    success: (...args: unknown[]) => successMock(...args),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

async function makeClient(): Promise<QueryClient> {
  const { notify } = await import("@/lib/toast");
  type QueryMeta = { silent?: boolean };
  type MutationMeta = { silent?: boolean; toastSuccess?: string };
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const meta = query.meta as QueryMeta | undefined;
        if (meta?.silent) return;
        notify.apiError(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _v, _c, mutation) => {
        const meta = mutation.meta as MutationMeta | undefined;
        if (meta?.silent) return;
        notify.apiError(error);
      },
      onSuccess: (_data, _v, _c, mutation) => {
        const meta = mutation.meta as MutationMeta | undefined;
        if (meta?.toastSuccess) notify.success(meta.toastSuccess);
      },
    }),
    defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
  });
}

describe("QueryClient global · onError/onSuccess → toast", () => {
  afterEach(() => {
    apiErrorMock.mockReset();
    successMock.mockReset();
  });

  it("query que falha dispara notify.apiError uma vez", async () => {
    const client = await makeClient();
    await client
      .fetchQuery({
        queryKey: ["q-fail"],
        queryFn: () => Promise.reject(new Error("boom")),
      })
      .catch(() => {});
    expect(apiErrorMock).toHaveBeenCalledTimes(1);
  });

  it("query com meta.silent=true NÃO dispara toast", async () => {
    const client = await makeClient();
    await client
      .fetchQuery({
        queryKey: ["q-silent"],
        queryFn: () => Promise.reject(new Error("boom")),
        meta: { silent: true },
      })
      .catch(() => {});
    expect(apiErrorMock).not.toHaveBeenCalled();
  });

  it("mutation que falha dispara notify.apiError; success com toastSuccess dispara notify.success", async () => {
    const client = await makeClient();
    // erro
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(new Error("nope")) })
      .execute(undefined)
      .catch(() => {});
    expect(apiErrorMock).toHaveBeenCalledTimes(1);

    // sucesso com toastSuccess
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.resolve("ok"),
        meta: { toastSuccess: "Salvo com sucesso" },
      })
      .execute(undefined);
    expect(successMock).toHaveBeenCalledWith("Salvo com sucesso");
  });

  it("mutation com meta.silent=true NÃO dispara toast de erro", async () => {
    const client = await makeClient();
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.reject(new Error("nope")),
        meta: { silent: true },
      })
      .execute(undefined)
      .catch(() => {});
    expect(apiErrorMock).not.toHaveBeenCalled();
  });
});
