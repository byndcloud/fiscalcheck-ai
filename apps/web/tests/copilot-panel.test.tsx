import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso, Contribuinte } from "@fiscalcheck/shared-types";

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

import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { useCopilotStore } from "@/stores/copilot-store";

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const CASOS_MOCK: Caso[] = [
  {
    id: "cs-2026-0148",
    contribuinteId: "ct-013",
    status: "candidato",
    criadoEm: "2026-06-30T08:15:00Z",
    atualizadoEm: "2026-07-02T09:12:00Z",
    divergenciaIds: [],
  },
];

const CONTRIBUINTES_MOCK: Contribuinte[] = [
  {
    id: "ct-013",
    cnpjMascarado: "**.***.***/0001-99",
    razaoSocial: "Confecções Vale Verde Ltda.",
    regime: "simples_nacional",
    situacao: "ativa",
    municipio: "Brusque",
    uf: "SC",
  },
];

function routeMock(path: string, options?: { method?: string }) {
  if (path === "/copilot/ask" && options?.method === "POST") {
    return Promise.resolve({
      mensagem: {
        id: "cpm-1",
        autor: "copilot",
        texto: "A alíquota de ISS varia de 2% a 5% conforme o serviço.",
        fontes: [{ label: "Código Tributário Municipal, art. 92" }],
        timestamp: new Date().toISOString(),
      },
    });
  }
  if (path === "/cases") return Promise.resolve(CASOS_MOCK);
  if (path === "/taxpayers") return Promise.resolve(CONTRIBUINTES_MOCK);
  return Promise.resolve(null);
}

describe("CopilotPanel (T18)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string, options?: { method?: string }) =>
      routeMock(path, options),
    );
    useCopilotStore.setState({ open: false, contextoCasoId: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("mostra o aviso human-in-the-loop e o estado vazio inicial", () => {
    useCopilotStore.getState().openCopilot();
    renderWithProviders(<CopilotPanel />);

    expect(
      screen.getByText(/o copilot consulta e fundamenta/i, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pergunte ao Copilot Fiscal/i)).toBeInTheDocument();
  });

  it("envia uma pergunta e mostra a resposta roteirizada com a fonte", async () => {
    useCopilotStore.getState().openCopilot();
    renderWithProviders(<CopilotPanel />);

    fireEvent.change(screen.getByLabelText(/Pergunta ao Copilot Fiscal/i), {
      target: { value: "Qual a alíquota do ISS?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Enviar pergunta/i }));

    await waitFor(() => {
      expect(screen.getByText(/A alíquota de ISS varia de 2% a 5%/)).toBeInTheDocument();
    });
    expect(screen.getByText("Código Tributário Municipal, art. 92")).toBeInTheDocument();
  });

  it("mostra o chip de contexto quando aberto a partir de um caso e permite removê-lo", async () => {
    useCopilotStore.getState().openCopilot("CS-2026-0148");
    renderWithProviders(<CopilotPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Confecções Vale Verde Ltda\./)).toBeInTheDocument();
    });
    expect(screen.getByText(/Contexto: CS-2026-0148/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Remover contexto do caso/i }));

    expect(useCopilotStore.getState().contextoCasoId).toBeNull();
  });
});
