import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { ArquivoIngerido, IntegracaoFonte } from "@/mocks/fixtures/arquivos";
import { handlers } from "@/mocks/handlers";

/*
  Módulo 1 — importação manual e integrações (ADMIN ONLY):
  - importar cria arquivo real no topo da lista, em "validando";
  - criar integração devolve 201 e ela aparece na listagem;
  - ambos negam papéis não-admin (403) — a ação também é registrada
    na trilha pelo handler (verificada via /compliance/audit-log-v2).
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "X-Actor-Role": "admin",
  "X-Actor-Id": "mock-admin",
  "X-Actor-Name": "Admin Teste",
};

describe("Ingestão — importação manual e integrações", () => {
  it("admin importa arquivo: 201, topo da lista, status validando", async () => {
    const res = await fetch(`${API_URL}/ingestion/files/import`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ nome: "NFSE_2026_07_extra.xml", fonte: "NFSe" }),
    });
    expect(res.status).toBe(201);
    const criado = (await res.json()) as ArquivoIngerido;
    expect(criado.status).toBe("validando");
    expect(criado.erros).toBe(0);

    const lista = (await (await fetch(`${API_URL}/ingestion/files`)).json()) as ArquivoIngerido[];
    expect(lista[0]?.id).toBe(criado.id);
  });

  it("auditor não importa (403) e payload inválido devolve 400", async () => {
    const forbidden = await fetch(`${API_URL}/ingestion/files/import`, {
      method: "POST",
      headers: { ...ADMIN_HEADERS, "X-Actor-Role": "auditor" },
      body: JSON.stringify({ nome: "NFSE_2026_07.xml", fonte: "NFSe" }),
    });
    expect(forbidden.status).toBe(403);

    const invalid = await fetch(`${API_URL}/ingestion/files/import`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ nome: "x", fonte: "NFSe" }),
    });
    expect(invalid.status).toBe(400);
  });

  it("admin cria integração e ela aparece na listagem; ação vai para a trilha", async () => {
    const res = await fetch(`${API_URL}/ingestion/integrations`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body: JSON.stringify({
        nome: "Cartórios — transações imobiliárias",
        tipo: "api",
        periodicidade: "semanal",
      }),
    });
    expect(res.status).toBe(201);
    const criada = (await res.json()) as IntegracaoFonte;
    expect(criada.criadaPor).toBe("Admin Teste");

    const lista = (await (
      await fetch(`${API_URL}/ingestion/integrations`)
    ).json()) as IntegracaoFonte[];
    expect(lista.some((i) => i.id === criada.id)).toBe(true);

    const trilha = (await (
      await fetch(`${API_URL}/compliance/audit-log-v2?action=ingestao.integracao_criada`)
    ).json()) as { action: string }[];
    expect(trilha.length).toBeGreaterThan(0);
  });

  it("cidadão não cria integração (403)", async () => {
    const res = await fetch(`${API_URL}/ingestion/integrations`, {
      method: "POST",
      headers: { ...ADMIN_HEADERS, "X-Actor-Role": "cidadao" },
      body: JSON.stringify({ nome: "Fonte indevida", tipo: "api", periodicidade: "diaria" }),
    });
    expect(res.status).toBe(403);
  });
});
