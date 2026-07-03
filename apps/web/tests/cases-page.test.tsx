import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso } from "@fiscalcheck/shared-types";

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
  }),
}));

vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

import CasesPage from "@/app/(dashboard)/cases/page";
import { useSession } from "@/stores/session-store";

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const CASOS_MOCK: Caso[] = [
  {
    id: "cs-2026-9001",
    contribuinteId: "ct-999",
    status: "aguardando_aprovacao",
    criadoEm: "2026-07-01T10:00:00Z",
    atualizadoEm: "2026-07-02T10:00:00Z",
    scoreValor: 80,
    divergenciaIds: ["dv-001"],
    agenteResponsavel: "ag-orquestrador",
    proximaAcaoRecomendada: "Emitir intimação",
    recomendacao: {
      acao: "intimacao",
      justificativa: "Divergência ISS x NFS-e.",
      confianca: 0.9,
      baseadaEm: ["dv-001"],
    },
  },
];

function routeMock(path: string) {
  if (path === "/cases") return Promise.resolve(CASOS_MOCK);
  if (path === "/taxpayers") return Promise.resolve([]);
  return Promise.resolve(null);
}

describe("CasesPage — smoke T13", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => routeMock(path));
    useSession.getState().setRole("auditor");
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("renderiza o cabeçalho da fila de casos e o toggle Kanban/Lista", async () => {
    renderWithProviders(<CasesPage />);

    expect(screen.getByText(/Gestão de casos/i)).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: /Visualização dos casos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Kanban/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Lista/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("CS-2026-9001")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Aguardando aprovação/i).length).toBeGreaterThan(0);
  });

  it("mantém o toggle sempre visível ao alternar para a Lista", async () => {
    renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText("CS-2026-9001")).toBeInTheDocument();
    });

    // Toggle visível em Kanban
    expect(screen.getByRole("tab", { name: /Kanban/i })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: /Lista/i }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Lista/i })).toHaveAttribute("aria-selected", "true");
    });
    // Toggle continua visível em Lista, e a busca da toolbar segue no lugar
    expect(screen.getByRole("tab", { name: /Kanban/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por ID/i)).toBeInTheDocument();
    expect(screen.getByText("CS-2026-9001")).toBeInTheDocument();
  });

  it("filtro global reduz o dataset em ambas as views", async () => {
    renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText("CS-2026-9001")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Buscar por ID/i), {
      target: { value: "nao-existe" },
    });

    await waitFor(() => {
      expect(screen.queryByText("CS-2026-9001")).not.toBeInTheDocument();
    });
  });
});
