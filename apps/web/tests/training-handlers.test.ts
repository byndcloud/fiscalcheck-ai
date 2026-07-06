import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { TrainingAttemptResult, TrainingCase } from "@fiscalcheck/shared-types";

import { handlers } from "@/mocks/handlers";

/*
  T20 — contrato dos handlers do Ambiente de Treinamento (módulo 6):
  - a biblioteca é 100% anonimizada (codinome + CNPJ mascarado);
  - o gabarito NUNCA vaza no GET antes da tentativa;
  - a tentativa exige justificativa, revela o gabarito e fica registrada;
  - exercício concluído não aceita segunda tentativa (gabarito já visto).
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function getCases(): Promise<TrainingCase[]> {
  const res = await fetch(`${API_URL}/training/cases`);
  expect(res.ok).toBe(true);
  return (await res.json()) as TrainingCase[];
}

describe("Ambiente de Treinamento — handlers (T20)", () => {
  it("biblioteca é anonimizada: codinomes e CNPJs mascarados, sem gabarito", async () => {
    const cases = await getCases();
    expect(cases.length).toBeGreaterThan(0);

    for (const exercise of cases) {
      expect(exercise.contribuinte.codinome).toMatch(/^Contribuinte /);
      // Raiz do CNPJ (parte identificável) totalmente mascarada; só o
      // sufixo genérico de matriz (0001) pode conter dígitos.
      expect(exercise.contribuinte.cnpjMascarado).toMatch(/^\*\*\.\*\*\*\.\*\*\*\//);
      expect(exercise.contribuinte.cnpjMascarado.split("/")[0]).not.toMatch(/\d/);
    }

    // Gabarito não pode viajar na lista antes da tentativa.
    const raw = JSON.stringify(cases.filter((c) => !c.tentativa));
    expect(raw).not.toContain("gabarito");
    expect(raw).not.toContain("aprendizado");
  });

  it("tentativa exige justificativa com pelo menos 20 caracteres", async () => {
    const [first] = await getCases();
    expect(first).toBeDefined();
    const res = await fetch(`${API_URL}/training/cases/${(first as TrainingCase).id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "aprovar", justificativa: "curta" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error_code: string };
    expect(body.error_code).toBe("invalid_training_attempt");
  });

  it("tentativa válida revela gabarito, avalia acerto e fica registrada", async () => {
    const cases = await getCases();
    const pendente = cases.find((c) => !c.tentativa);
    expect(pendente).toBeDefined();
    const exercise = pendente as TrainingCase;

    const res = await fetch(`${API_URL}/training/cases/${exercise.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "aprovar",
        justificativa: "Divergência recorrente e bem evidenciada pelas notas fiscais do período.",
      }),
    });
    expect(res.ok).toBe(true);
    const result = (await res.json()) as TrainingAttemptResult;

    expect(result.casoId).toBe(exercise.id);
    expect(result.gabarito.justificativa.length).toBeGreaterThan(0);
    expect(result.aprendizado.length).toBeGreaterThan(0);
    expect(result.acertou).toBe(result.suaDecisao.acao === result.gabarito.acao);

    // A tentativa reaparece no GET — progresso persistido in-memory.
    const after = await getCases();
    const done = after.find((c) => c.id === exercise.id);
    expect(done?.tentativa?.suaDecisao.acao).toBe("aprovar");
  });

  it("bloqueia segunda tentativa no mesmo exercício (gabarito já revelado)", async () => {
    const cases = await getCases();
    const concluido = cases.find((c) => c.tentativa);
    expect(concluido).toBeDefined();

    const res = await fetch(`${API_URL}/training/cases/${(concluido as TrainingCase).id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "rejeitar",
        justificativa: "Segunda tentativa para tentar acertar depois de ver o gabarito.",
      }),
    });
    expect(res.status).toBe(409);
  });

  it("retorna 404 para exercício inexistente", async () => {
    const res = await fetch(`${API_URL}/training/cases/tr-999/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao: "aprovar",
        justificativa: "Justificativa longa o suficiente para passar na validação.",
      }),
    });
    expect(res.status).toBe(404);
  });
});
