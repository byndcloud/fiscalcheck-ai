import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "@fiscalcheck/shared-types";

const apiRequestMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  ApiError: class ApiError extends Error {},
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

import { GlobalSearch } from "@/components/app-shell/global-search";
import { useDossieStore } from "@/stores/dossie-store";
import { useSession } from "@/stores/session-store";

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const RESULTADOS_MOCK: SearchResult[] = [
  {
    tipo: "caso",
    id: "cs-2026-0148",
    titulo: "CS-2026-0148",
    subtitulo: "Metalúrgica Nova Aurora Ltda.",
    status: "candidato",
    casoRelacionadoId: "cs-2026-0148",
  },
  {
    tipo: "contribuinte",
    id: "ct-001",
    titulo: "Metalúrgica Nova Aurora Ltda.",
    subtitulo: "Nova Aurora · **.***.***/0001-42",
    nivelRisco: "alto",
    casoRelacionadoId: "cs-2026-0148",
  },
];

describe("GlobalSearch (T24)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => {
      if (path.startsWith("/search")) return Promise.resolve(RESULTADOS_MOCK);
      return Promise.resolve([]);
    });
    useDossieStore.setState({ openCasoId: null });
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("não renderiza para papel não interno (cidadão)", () => {
    useSession.getState().setRole("cidadao");
    renderWithProviders(<GlobalSearch />);
    expect(screen.queryByPlaceholderText(/Buscar CNPJ/i)).not.toBeInTheDocument();
  });

  it("mostra resultados agrupados por tipo ao digitar", async () => {
    useSession.getState().setRole("auditor");
    renderWithProviders(<GlobalSearch />);

    fireEvent.change(screen.getByPlaceholderText(/Buscar CNPJ/i), { target: { value: "nova" } });

    await waitFor(() => {
      expect(screen.getByText("CS-2026-0148")).toBeInTheDocument();
    });
    expect(screen.getByText("Caso")).toBeInTheDocument();
    expect(screen.getByText("Contribuinte")).toBeInTheDocument();
  });

  it("Enter no resultado ativo abre o dossiê pelo store global (sem navegação de rota)", async () => {
    useSession.getState().setRole("auditor");
    renderWithProviders(<GlobalSearch />);

    const input = screen.getByPlaceholderText(/Buscar CNPJ/i);
    fireEvent.change(input, { target: { value: "nova" } });

    await waitFor(() => {
      expect(screen.getByText("CS-2026-0148")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(useDossieStore.getState().openCasoId).toBe("cs-2026-0148");
    });
  });

  it("mostra estado vazio quando a busca não retorna resultados", async () => {
    apiRequestMock.mockImplementation(() => Promise.resolve([]));
    useSession.getState().setRole("auditor");
    renderWithProviders(<GlobalSearch />);

    fireEvent.change(screen.getByPlaceholderText(/Buscar CNPJ/i), { target: { value: "zzz" } });

    await waitFor(() => {
      expect(screen.getByText(/Nenhum resultado/i)).toBeInTheDocument();
    });
  });
});
