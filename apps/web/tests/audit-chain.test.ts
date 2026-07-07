import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { AuditChainIntegrity, AuditLogEntry } from "@fiscalcheck/shared-types";

import { computeChainHash } from "@/lib/compliance/audit-chain";
import { handlers } from "@/mocks/handlers";

/*
  Integridade da trilha (módulo 6 · TR 5.4.9):
  - o hash encadeado é determinístico e sensível a QUALQUER alteração
    em evento passado (é isso que torna a imutabilidade demonstrável);
  - o endpoint devolve status "integra" com o total de eventos e o
    hash atual da cadeia;
  - um novo evento (export) muda o hash — a cadeia avança, nunca
    reescreve.
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: "aud-test-001",
    timestamp: "2026-07-01T10:00:00Z",
    action: "usuario.login",
    actorId: "mock-admin",
    actorName: "Admin Teste",
    actorRole: "admin",
    ipAddress: "10.0.0.1",
    resource: "sessao:teste",
    result: "sucesso",
    atypical: false,
    correlationId: "cor-teste",
    details: "Evento sintético de teste.",
    ...overrides,
  };
}

describe("computeChainHash", () => {
  it("é determinístico para a mesma cadeia", () => {
    const entries = [makeEntry({ id: "aud-2" }), makeEntry({ id: "aud-1" })];
    expect(computeChainHash(entries)).toBe(computeChainHash(entries));
  });

  it("muda quando um evento passado é alterado (violação detectável)", () => {
    const original = [makeEntry({ id: "aud-2" }), makeEntry({ id: "aud-1" })];
    const adulterada = [
      makeEntry({ id: "aud-2" }),
      makeEntry({ id: "aud-1", action: "caso.decisao_aprovada" }),
    ];
    expect(computeChainHash(original)).not.toBe(computeChainHash(adulterada));
  });

  it("muda quando um evento é removido", () => {
    const completa = [makeEntry({ id: "aud-2" }), makeEntry({ id: "aud-1" })];
    const truncada = [makeEntry({ id: "aud-2" })];
    expect(computeChainHash(completa)).not.toBe(computeChainHash(truncada));
  });
});

describe("GET /compliance/audit-log-v2/integrity", () => {
  it("devolve cadeia íntegra com total de eventos e hash", async () => {
    const res = await fetch(`${API_URL}/compliance/audit-log-v2/integrity`);
    expect(res.ok).toBe(true);
    const body = (await res.json()) as AuditChainIntegrity;

    expect(body.status).toBe("integra");
    expect(body.totalEventos).toBeGreaterThan(0);
    expect(body.chainHash).toMatch(/^[0-9a-f]{8}$/);
    expect(body.algoritmo).toContain("FNV-1a");
  });

  it("novo evento na trilha (export) altera o hash da cadeia", async () => {
    const antes = (await (
      await fetch(`${API_URL}/compliance/audit-log-v2/integrity`)
    ).json()) as AuditChainIntegrity;

    const exportRes = await fetch(`${API_URL}/compliance/audit-log-v2/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor-Role": "admin",
        "X-Actor-Id": "mock-admin",
        "X-Actor-Name": "Admin Teste",
      },
      body: JSON.stringify({ format: "csv", total: 10 }),
    });
    expect(exportRes.ok).toBe(true);

    const depois = (await (
      await fetch(`${API_URL}/compliance/audit-log-v2/integrity`)
    ).json()) as AuditChainIntegrity;

    expect(depois.totalEventos).toBe(antes.totalEventos + 1);
    expect(depois.chainHash).not.toBe(antes.chainHash);
    expect(depois.status).toBe("integra");
  });
});
