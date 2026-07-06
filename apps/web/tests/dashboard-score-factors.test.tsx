import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso, Score } from "@fiscalcheck/shared-types";

const apiRequestMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
      public correlationId: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));

import DashboardPage from "@/app/(dashboard)/dashboard/page";

/*
  T09 — aceite "todo score exibido na plataforma dá acesso ao painel de
  fatores": o dashboard mostra score nos casos priorizados e agora abre
  o painel "Por que este score?".
*/

const caso = {
  id: "cs-2026-0148",
  contribuinteId: "ct-013",
  status: "candidato",
  criadoEm: "2026-06-30T08:15:00Z",
  atualizadoEm: "2026-07-02T09:12:00Z",
  scoreValor: 89,
  divergenciaIds: ["dv-011"],
  proximaAcaoRecomendada: "Priorizar análise.",
} as Caso;

const score: Score = {
  contribuinteId: "ct-013",
  valor: 89,
  nivel: "critico",
  calculadoEm: "2026-07-01T06:00:00Z",
  modeloVersao: "risk-model@2.3.1",
  fatores: [
    {
      nome: "Volume DIMP acima das NFS-e",
      peso: 0.5,
      contribuicao: 46,
      evidencia: "Operações de cartão 42% acima das notas emitidas.",
      origem: "cruzamento",
    },
  ],
};

describe("Dashboard — acesso aos fatores do score (T09)", () => {
  beforeEach(() => {
    apiRequestMock.mockImplementation((path: unknown) => {
      if (path === "/cases") return Promise.resolve([caso]);
      if (path === "/ai/scores") return Promise.resolve([score]);
      // Demais painéis ficam em loading — irrelevantes para este aceite.
      return new Promise(() => {});
    });
  });

  afterEach(() => {
    cleanup();
    apiRequestMock.mockReset();
  });

  it("botão 'Ver fatores' no caso priorizado abre o painel 'Por que este score?'", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    const botao = await screen.findByRole("button", {
      name: /Ver fatores do score do contribuinte ct-013/i,
    });
    fireEvent.click(botao);

    // Título do Sheet + cabeçalho do painel de fatores.
    expect((await screen.findAllByText("Por que este score?")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Volume DIMP acima das NFS-e")).toBeInTheDocument();
    expect(
      screen.getByText(/registrada para defesa perante órgãos de controle/i),
    ).toBeInTheDocument();
  });
});
