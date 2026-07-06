import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso, CtcBatch, CtcFeed } from "@fiscalcheck/shared-types";

import { BATCH_INTERVAL_MS, resetCtcFeedForTests } from "@/mocks/fixtures/ctc-feed";
import { handlers } from "@/mocks/handlers";

/*
  T07 — contrato do feed CTC (módulo 2):
  - o feed anda sozinho conforme o relógio (novos lotes por intervalo);
  - todo alerta antecipado cita a regra que disparou e a janela
    "fato gerador → detecção" (aceites);
  - sugerir autorregularização abre caso candidato real e é idempotente.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetCtcFeedForTests());
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

async function getFeed(): Promise<CtcFeed> {
  const res = await fetch(`${API_URL}/crossing/ctc/feed`);
  expect(res.ok).toBe(true);
  return (await res.json()) as CtcFeed;
}

describe("Feed CTC — handlers (T07)", () => {
  it("devolve lotes com contadores e alertas citando a regra e a janela de detecção", async () => {
    const feed = await getFeed();

    expect(feed.lotes.length).toBeGreaterThan(0);
    expect(feed.totalNotas).toBe(feed.lotes.reduce((acc, l) => acc + l.notas, 0));

    const alertados = feed.lotes.filter((l) => l.alerta);
    expect(alertados.length).toBeGreaterThan(0);
    expect(feed.totalAlertas).toBe(alertados.length);
    expect(feed.janelaMediaMinutos).toBeGreaterThan(0);

    for (const lote of alertados) {
      expect(lote.alerta?.regra.length).toBeGreaterThan(0);
      expect(lote.alerta?.janelaMinutos).toBeGreaterThan(0);
      expect(lote.alerta?.contribuinteNome.length).toBeGreaterThan(0);
    }
  });

  it("feed anda sozinho: avanço do relógio gera lotes novos", async () => {
    // Só o Date é falsificado — fetch/streams continuam com timers reais.
    vi.useFakeTimers({ toFake: ["Date"] });

    const antes = await getFeed();
    const primeiroAntes = antes.lotes[0] as CtcBatch;

    vi.setSystemTime(Date.now() + BATCH_INTERVAL_MS * 3);
    const depois = await getFeed();
    const primeiroDepois = depois.lotes[0] as CtcBatch;

    expect(primeiroDepois.seq).toBeGreaterThan(primeiroAntes.seq);
    expect(primeiroDepois.seq - primeiroAntes.seq).toBe(3);
  });

  it("sugerir autorregularização abre caso candidato e bloqueia repetição", async () => {
    const feed = await getFeed();
    const alertado = feed.lotes.find((l) => l.alerta && !l.alerta.sugestaoEnviada);
    expect(alertado).toBeDefined();
    const alerta = (alertado as CtcBatch).alerta;
    expect(alerta).toBeDefined();
    if (!alerta) return;

    const res = await fetch(`${API_URL}/crossing/ctc/alerts/${alerta.id}/suggest`, {
      method: "POST",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { alertaId: string; casoId: string };
    expect(body.alertaId).toBe(alerta.id);

    // Caso candidato real com recomendação de autorregularização.
    const casos = (await (await fetch(`${API_URL}/cases`)).json()) as Caso[];
    const caso = casos.find((c) => c.id === body.casoId);
    expect(caso).toBeDefined();
    expect(caso?.status).toBe("candidato");
    expect(caso?.recomendacao?.acao).toBe("autorregularizacao");
    expect(caso?.recomendacao?.justificativa).toContain(alerta.regra);

    // O feed reflete a sugestão enviada.
    const atualizado = await getFeed();
    const mesmoAlerta = atualizado.lotes.find((l) => l.alerta?.id === alerta.id)?.alerta;
    expect(mesmoAlerta?.sugestaoEnviada).toBe(true);
    expect(mesmoAlerta?.casoId).toBe(body.casoId);

    // Idempotência: segunda sugestão devolve 409.
    const again = await fetch(`${API_URL}/crossing/ctc/alerts/${alerta.id}/suggest`, {
      method: "POST",
    });
    expect(again.status).toBe(409);
  });

  it("alerta fora da janela devolve 404", async () => {
    await getFeed();
    const res = await fetch(`${API_URL}/crossing/ctc/alerts/ctc-al-9999/suggest`, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });
});
