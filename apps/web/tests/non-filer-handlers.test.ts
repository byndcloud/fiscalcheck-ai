import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Caso, NonFiler } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T06 — contrato dos handlers de Non-filer Discovery (módulo 2):
  - fila priorizada por receita estimada (desc), cada item com a fonte
    do indício e a estimativa de receita não declarada;
  - "abrir caso candidato" cria um caso REAL visível em GET /cases;
  - segunda tentativa no mesmo prestador devolve 409 (idempotência).
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getFila(): Promise<NonFiler[]> {
  const res = await fetch(`${API_URL}/crossing/non-filers`);
  expect(res.ok).toBe(true);
  return (await res.json()) as NonFiler[];
}

describe("Non-filer Discovery — handlers (T06)", () => {
  it("fila vem priorizada por receita estimada, com origem do indício em cada item", async () => {
    const fila = await getFila();
    expect(fila.length).toBeGreaterThanOrEqual(5);

    for (let i = 1; i < fila.length; i += 1) {
      const anterior = fila[i - 1] as NonFiler;
      const atual = fila[i] as NonFiler;
      expect(anterior.receitaEstimada12m).toBeGreaterThanOrEqual(atual.receitaEstimada12m);
    }

    for (const nf of fila) {
      expect(nf.indicios.length).toBeGreaterThan(0);
      for (const indicio of nf.indicios) {
        expect(["nfse_terceiros", "meios_pagamento", "fonte_aberta"]).toContain(indicio.fonte);
        expect(indicio.referencia.length).toBeGreaterThan(0);
      }
      // Documento sempre mascarado (AGENTS.md §1.2)
      expect(nf.documentoMascarado).toContain("*");
    }
  });

  it("abrir caso candidato cria caso real na fila do módulo 4 e marca o prestador", async () => {
    const fila = await getFila();
    const alvo = fila.find((nf) => nf.status === "novo") as NonFiler;
    expect(alvo).toBeDefined();

    const res = await fetch(`${API_URL}/crossing/non-filers/${alvo.id}/open-case`, {
      method: "POST",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { nonFiler: NonFiler; caso: Caso };

    expect(body.caso.status).toBe("candidato");
    expect(body.caso.valorPotencial).toBe(alvo.receitaEstimada12m);
    expect(body.caso.recomendacao?.baseadaEm).toContain(alvo.id);
    expect(body.nonFiler.status).toBe("caso_aberto");
    expect(body.nonFiler.casoId).toBe(body.caso.id);

    // O caso aparece de verdade na fila do módulo 4.
    const casesRes = await fetch(`${API_URL}/cases`);
    const casos = (await casesRes.json()) as Caso[];
    expect(casos.some((c) => c.id === body.caso.id)).toBe(true);

    // Segunda tentativa: 409 com o caso já aberto.
    const again = await fetch(`${API_URL}/crossing/non-filers/${alvo.id}/open-case`, {
      method: "POST",
    });
    expect(again.status).toBe(409);
    const conflict = (await again.json()) as {
      error_code: string;
      casoId: string;
    };
    expect(conflict.error_code).toBe("non_filer_case_already_open");
    expect(conflict.casoId).toBe(body.caso.id);
  });

  it("prestador inexistente devolve 404", async () => {
    const res = await fetch(`${API_URL}/crossing/non-filers/nf-radar-999/open-case`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });
});
