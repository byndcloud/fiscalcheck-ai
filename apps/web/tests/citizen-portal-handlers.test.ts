import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Caso, CitizenActionResponse, Notificacao } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T16 — contrato dos handlers do Portal do Contribuinte:
  - o portal só expõe casos formalizados (sigilo art. 198 CTN);
  - toda ação gera protocolo;
  - a adesão ao parcelamento gera devolutiva ao auditor (notificação
    tipo `devolutiva` no sino) e move o caso para autorregularização.

  Usa msw/node contra o mesmo array de handlers do browser — o estado
  in-memory é compartilhado dentro do processo de teste.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  expect(res.ok).toBe(true);
  return (await res.json()) as T;
}

describe("Portal do Contribuinte — handlers (T16)", () => {
  it("expõe apenas casos formalizados ao contribuinte", async () => {
    const casos = await getJson<Caso[]>("/citizen/cases");
    expect(casos.length).toBeGreaterThan(0);
    for (const caso of casos) {
      expect(["notificado", "em_autorregularizacao", "fiscalizacao", "encerrado"]).toContain(
        caso.status,
      );
    }
  });

  it("registra ciência com protocolo e bloqueia duplicata", async () => {
    const casos = await getJson<Caso[]>("/citizen/cases");
    const notificado = casos.find((c) => c.status === "notificado");
    expect(notificado).toBeDefined();
    const casoId = (notificado as Caso).id;

    const res = await fetch(`${API_URL}/citizen/cases/${casoId}/ciencia`, { method: "POST" });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as CitizenActionResponse;
    expect(body.interacao.protocolo).toMatch(/^PRT-2026-\d{6}$/);
    expect(body.interacao.tipo).toBe("ciencia");

    const dup = await fetch(`${API_URL}/citizen/cases/${casoId}/ciencia`, { method: "POST" });
    expect(dup.status).toBe(409);
  });

  it("adesão ao parcelamento gera guia, move o caso e cria devolutiva no sino", async () => {
    const casos = await getJson<Caso[]>("/citizen/cases");
    const alvo = casos.find((c) => (c.valorPotencial ?? 0) > 0 && c.status !== "encerrado");
    expect(alvo).toBeDefined();
    const casoId = (alvo as Caso).id;

    const res = await fetch(`${API_URL}/citizen/cases/${casoId}/parcelamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelas: 6 }),
    });
    expect(res.ok).toBe(true);
    const body = (await res.json()) as CitizenActionResponse;

    expect(body.interacao.protocolo).toMatch(/^PRT-2026-\d{6}$/);
    expect(body.guia?.numero).toMatch(/^DAM-2026-\d{5}$/);
    expect(body.caso.status).toBe("em_autorregularizacao");
    expect(body.caso.observacoes).toContain(body.interacao.protocolo);

    // Devolutiva visível ao auditor (aceite T16 × T14).
    const notificacoes = await getJson<Notificacao[]>("/notifications");
    const devolutiva = notificacoes.find((n) => n.tipo === "devolutiva" && n.casoId === casoId);
    expect(devolutiva).toBeDefined();
  });

  it("contestação exige mensagem mínima e devolve protocolo", async () => {
    const casos = await getJson<Caso[]>("/citizen/cases");
    const alvo = casos.find((c) => c.status !== "encerrado");
    const casoId = (alvo as Caso).id;

    const invalida = await fetch(`${API_URL}/citizen/cases/${casoId}/contestacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assunto: "Teste", mensagem: "curta" }),
    });
    expect(invalida.status).toBe(400);

    const valida = await fetch(`${API_URL}/citizen/cases/${casoId}/contestacao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assunto: "Notas já declaradas",
        mensagem: "As notas apontadas foram declaradas na competência seguinte, conforme recibo.",
        arquivos: [{ nome: "recibo.pdf", tamanhoBytes: 1024 }],
      }),
    });
    expect(valida.ok).toBe(true);
    const body = (await valida.json()) as CitizenActionResponse;
    expect(body.interacao.tipo).toBe("contestacao");
    expect(body.interacao.protocolo).toMatch(/^PRT-2026-\d{6}$/);
  });

  it("não expõe caso de contribuinte fora da sessão mock", async () => {
    // cs-2026-0148 pertence a ct-013 — fora da carteira do portal.
    const res = await fetch(`${API_URL}/citizen/cases/cs-2026-0148/ciencia`, { method: "POST" });
    expect(res.status).toBe(404);
  });
});
