import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import AnaliseDeRedesPage from "@/app/(dashboard)/analise-de-redes/page";
import { networkScenariosFixture } from "@/mocks/fixtures/network-scenarios";

/*
  T12 — aceites de UI da Análise de Redes:
  - 5 cenários demonstráveis listados abaixo do grafo;
  - clicar num cenário troca a comunidade exibida no canvas;
  - clicar num nó abre o drawer com o detalhe da entidade (resolução de
    identidades + risco de rede).
*/

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AnaliseDeRedesPage />
    </QueryClientProvider>,
  );
}

describe("Análise de Redes — página (T12)", () => {
  beforeEach(() => {
    apiRequestMock.mockResolvedValue(networkScenariosFixture);
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lista os 5 cenários abaixo do grafo e mostra a comunidade padrão", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Fragmentação artificial de receita — polo têxtil/),
      ).toBeInTheDocument();
    });

    // Biblioteca de cenários (aceite: ao menos 5 demonstráveis).
    for (const scenario of networkScenariosFixture) {
      expect(screen.getByText(scenario.titulo)).toBeInTheDocument();
    }

    // Comunidade padrão (C-07) no badge do header e padrões detectados.
    expect(screen.getAllByText(/C-07/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Endereço compartilhado").length).toBeGreaterThan(0);
    expect(screen.getByText(/Recomendação do agente/i)).toBeInTheDocument();
  });

  it("clicar num cenário da lista troca o grafo exibido", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/polo têxtil/)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /Conluio em cadeia de fornecedores/i,
      }),
    );

    await waitFor(() => {
      // Nó exclusivo do cenário C-11 aparece no canvas.
      expect(
        screen.getByRole("button", { name: /Construtora Vila Nova S\.A\./i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Circuito financeiro fechado")).toBeInTheDocument();
  });

  it("clicar num nó abre o drawer com identidades unificadas e risco de rede", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/polo têxtil/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /M\. Bertoldi — score de rede 92/i }));

    await waitFor(() => {
      expect(screen.getByText("Identidades unificadas")).toBeInTheDocument();
    });
    expect(screen.getByText("Risco de rede")).toBeInTheDocument();
    expect(screen.getByText(/Sócio nas 3 confecções da rede/)).toBeInTheDocument();
    expect(screen.getByText(/Adicionar ao caso/)).toBeInTheDocument();
  });
});
