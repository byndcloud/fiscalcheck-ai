import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TrainingAttemptResult, TrainingCase } from "@fiscalcheck/shared-types";

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
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import TreinamentoPage from "@/app/(dashboard)/treinamento/page";

/*
  T20 — página do Ambiente de Treinamento:
  - faixa âmbar "AMBIENTE DE TREINAMENTO · dados anonimizados" sempre visível;
  - biblioteca com progresso e cards anonimizados;
  - fluxo do exercício: decidir + justificar → gabarito "sua decisão ×
    decisão histórica".
*/

const exerciseFixture: TrainingCase = {
  id: "tr-001",
  titulo: "Notas emitidas acima do declarado no PGDAS",
  dificuldade: "iniciante",
  contribuinte: {
    codinome: "Contribuinte Alfa",
    cnpjMascarado: "**.***.***/0001-**",
    atividade: "Serviços de limpeza e conservação",
    regime: "Simples Nacional",
  },
  contexto: "O cruzamento mensal apontou diferença crescente entre NFS-e e PGDAS-D.",
  divergencia: {
    tipo: "subdeclaracao",
    resumo: "NFS-e somam R$ 84.300 contra R$ 61.000 declarados.",
    valorDeclarado: 61000,
    valorApurado: 84300,
    competencia: "2026-03",
  },
  scoreValor: 78,
  fatoresResumo: ["Diferença declarado × NFS-e recorrente"],
  recomendacaoAgente: "Notificar para autorregularização antes de abrir fiscalização.",
};

const attemptResultFixture: TrainingAttemptResult = {
  casoId: "tr-001",
  acertou: true,
  suaDecisao: {
    acao: "aprovar",
    justificativa: "Divergência recorrente e bem evidenciada pelas notas do período.",
  },
  gabarito: {
    acao: "aprovar",
    justificativa: "A notificação para autorregularização é a medida proporcional.",
    resultado: "O contribuinte aderiu à autorregularização em 12 dias.",
  },
  aprendizado: "Subdeclaração sem sinal de fraude pede o caminho menos gravoso primeiro.",
  tentadoEm: "2026-07-05T12:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TreinamentoPage />
    </QueryClientProvider>,
  );
}

describe("TreinamentoPage (T20)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("exibe a faixa âmbar de treinamento e a biblioteca anonimizada", async () => {
    apiRequestMock.mockResolvedValue([exerciseFixture]);
    renderPage();

    expect(
      await screen.findByText(/Ambiente de treinamento · dados anonimizados/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Notas emitidas acima do declarado no PGDAS"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Contribuinte Alfa/)).toBeInTheDocument();
    expect(screen.getByText(/0 de 1 exercícios concluídos/)).toBeInTheDocument();
    // Nenhum CNPJ real — apenas máscara.
    expect(screen.getByText("**.***.***/0001-**")).toBeInTheDocument();
  });

  it("fluxo do exercício: decidir + justificar revela 'sua decisão × decisão histórica'", async () => {
    apiRequestMock.mockImplementation((path: unknown, options?: { method?: string }) => {
      if (typeof path === "string" && path.endsWith("/attempt") && options?.method === "POST") {
        return Promise.resolve(attemptResultFixture);
      }
      return Promise.resolve([exerciseFixture]);
    });
    renderPage();

    fireEvent.click(await screen.findByText("Notas emitidas acima do declarado no PGDAS"));

    // Painel do exercício aberto — decide e justifica.
    fireEvent.click(await screen.findByRole("button", { name: "Aprovar recomendação" }));
    fireEvent.change(screen.getByLabelText(/Justificativa/), {
      target: {
        value: "Divergência recorrente e bem evidenciada pelas notas do período.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /Registrar decisão e ver gabarito/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sua decisão × decisão histórica/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Alinhado ao gabarito/i)).toBeInTheDocument();
    expect(
      screen.getByText(/O contribuinte aderiu à autorregularização em 12 dias/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Subdeclaração sem sinal de fraude pede o caminho menos gravoso/),
    ).toBeInTheDocument();
  });

  it("bloqueia envio sem justificativa mínima", async () => {
    apiRequestMock.mockResolvedValue([exerciseFixture]);
    renderPage();

    fireEvent.click(await screen.findByText("Notas emitidas acima do declarado no PGDAS"));
    fireEvent.click(await screen.findByRole("button", { name: "Aprovar recomendação" }));
    fireEvent.change(screen.getByLabelText(/Justificativa/), { target: { value: "curta" } });
    fireEvent.click(screen.getByRole("button", { name: /Registrar decisão e ver gabarito/i }));

    expect(await screen.findByText(/pelo menos 20 caracteres/i)).toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/attempt"),
      expect.anything(),
    );
  });
});
