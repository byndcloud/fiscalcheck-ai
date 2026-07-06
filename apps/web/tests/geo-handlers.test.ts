import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Caso, GeoObra } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T21 — contrato dos handlers de Geofiscalização (módulo 7):
  - mapa carrega 10–15 pins ordenados por severidade (aceite);
  - "gerar caso" cria caso candidato REAL na fila do módulo 4 com
    `agenteResponsavel` (é o que ativa o badge AGENTE no Kanban T13);
  - idempotência: segunda tentativa devolve 409 com o caso já aberto.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getObras(): Promise<GeoObra[]> {
  const res = await fetch(`${API_URL}/support/geofiscalizacao/obras`);
  expect(res.ok).toBe(true);
  return (await res.json()) as GeoObra[];
}

describe("Geofiscalização — handlers (T21)", () => {
  it("devolve 10–15 pins ordenados por severidade do indício (desc)", async () => {
    const obras = await getObras();
    expect(obras.length).toBeGreaterThanOrEqual(10);
    expect(obras.length).toBeLessThanOrEqual(15);

    for (let i = 1; i < obras.length; i += 1) {
      const anterior = obras[i - 1] as GeoObra;
      const atual = obras[i] as GeoObra;
      expect(anterior.severidade).toBeGreaterThanOrEqual(atual.severidade);
    }
  });

  it("gerar caso cria candidato real na fila do módulo 4 com badge AGENTE", async () => {
    const obras = await getObras();
    const alvo = obras.find((o) => o.status === "novo") as GeoObra;
    expect(alvo).toBeDefined();

    const res = await fetch(`${API_URL}/support/geofiscalizacao/obras/${alvo.id}/open-case`, {
      method: "POST",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { obra: GeoObra; caso: Caso };

    expect(body.caso.status).toBe("candidato");
    // `agenteResponsavel` presente = pílula AGENTE no card do Kanban (T13).
    expect(body.caso.agenteResponsavel).toBeDefined();
    expect(body.caso.contribuinteId).toBe(alvo.contribuinteId);
    expect(body.caso.valorPotencial).toBe(
      Math.max(0, alvo.valorEstimadoObra - alvo.nfseConstrucao12m),
    );
    expect(body.caso.recomendacao?.baseadaEm).toContain(alvo.id);
    expect(body.obra.status).toBe("caso_aberto");
    expect(body.obra.casoId).toBe(body.caso.id);

    // O caso aparece de verdade na fila do módulo 4 (T13 reaproveitado).
    const casesRes = await fetch(`${API_URL}/cases`);
    const casos = (await casesRes.json()) as Caso[];
    expect(casos.some((c) => c.id === body.caso.id)).toBe(true);

    // Segunda tentativa: 409 com o caso já aberto.
    const again = await fetch(`${API_URL}/support/geofiscalizacao/obras/${alvo.id}/open-case`, {
      method: "POST",
    });
    expect(again.status).toBe(409);
    const conflict = (await again.json()) as { error_code: string; casoId: string };
    expect(conflict.error_code).toBe("geo_case_already_open");
    expect(conflict.casoId).toBe(body.caso.id);
  });

  it("sem alvará recomenda fiscalização; com alvará, autorregularização", async () => {
    const obras = await getObras();
    const semAlvara = obras.find(
      (o) => o.status === "novo" && o.alvara.situacao === "sem_alvara",
    ) as GeoObra;
    const comAlvara = obras.find(
      (o) => o.status === "novo" && o.alvara.situacao !== "sem_alvara",
    ) as GeoObra;
    expect(semAlvara).toBeDefined();
    expect(comAlvara).toBeDefined();

    const resSem = await fetch(
      `${API_URL}/support/geofiscalizacao/obras/${semAlvara.id}/open-case`,
      { method: "POST" },
    );
    const bodySem = (await resSem.json()) as { caso: Caso };
    expect(bodySem.caso.recomendacao?.acao).toBe("fiscalizacao");

    const resCom = await fetch(
      `${API_URL}/support/geofiscalizacao/obras/${comAlvara.id}/open-case`,
      { method: "POST" },
    );
    const bodyCom = (await resCom.json()) as { caso: Caso };
    expect(bodyCom.caso.recomendacao?.acao).toBe("autorregularizacao");
  });

  it("obra inexistente devolve 404", async () => {
    const res = await fetch(`${API_URL}/support/geofiscalizacao/obras/og-999/open-case`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });
});
