import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { NetworkScenario } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T12 — contrato do endpoint de Análise de Redes (módulo 3):
  - ao menos 5 cenários demonstráveis, incluindo fragmentação artificial
    de receita e conluio (aceite);
  - integridade do grafo: todo vínculo referencia nós existentes;
  - sigilo: documentos sempre mascarados (AGENTS.md §1.2).
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getScenarios(): Promise<NetworkScenario[]> {
  const res = await fetch(`${API_URL}/network/scenarios`);
  expect(res.ok).toBe(true);
  return (await res.json()) as NetworkScenario[];
}

describe("Análise de Redes — handlers (T12)", () => {
  it("expõe ao menos 5 cenários, com fragmentação de receita e conluio (aceite)", async () => {
    const scenarios = await getScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(5);

    const esquemas = scenarios.map((s) => s.esquema);
    expect(esquemas).toContain("fragmentacao_receita");
    expect(esquemas).toContain("conluio_fornecedores");
  });

  it("todo vínculo referencia nós existentes e todo cenário tem padrões + recomendação", async () => {
    const scenarios = await getScenarios();
    for (const scenario of scenarios) {
      const nodeIds = new Set(scenario.nos.map((n) => n.id));
      for (const vinculo of scenario.vinculos) {
        expect(nodeIds.has(vinculo.origem)).toBe(true);
        expect(nodeIds.has(vinculo.destino)).toBe(true);
      }
      expect(scenario.padroes.length).toBeGreaterThan(0);
      expect(scenario.recomendacao.resumo.length).toBeGreaterThan(0);
      expect(scenario.recomendacao.acaoSugerida.length).toBeGreaterThan(0);
    }
  });

  it("indicadores de risco de rede presentes em cada nó (score, centralidade, autuados)", async () => {
    const scenarios = await getScenarios();
    for (const scenario of scenarios) {
      for (const no of scenario.nos) {
        expect(no.scoreRede).toBeGreaterThanOrEqual(0);
        expect(no.scoreRede).toBeLessThanOrEqual(100);
        expect(no.centralidade).toBeGreaterThanOrEqual(0);
        expect(no.centralidade).toBeLessThanOrEqual(1);
        expect(no.ligacoesAutuados).toBeGreaterThanOrEqual(0);
        // Sigilo fiscal: CNPJ/CPF nunca em claro.
        if (no.documento && (no.tipo === "empresa" || no.tipo === "socio")) {
          expect(no.documento).toContain("*");
        }
      }
    }
  });
});
