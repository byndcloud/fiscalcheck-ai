import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Comunicacao, Contribuinte } from "@fiscalcheck/shared-types";

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

import ComunicacoesPage from "@/app/(dashboard)/comunicacoes/page";
import { useSession } from "@/stores/session-store";

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const CONTRIBUINTES_MOCK: Contribuinte[] = [
  {
    id: "ct-001",
    cnpjMascarado: "12.***.***/****-90",
    razaoSocial: "Nova Aurora Confecções Ltda.",
    nomeFantasia: "Nova Aurora",
    regime: "lucro_presumido",
    situacao: "ativa",
    inscricaoMunicipal: "IM-1001",
    atividadePrincipal: "Confecção de peças",
    municipio: "Brusque",
    uf: "SC",
  },
  {
    id: "ct-002",
    cnpjMascarado: "22.***.***/****-33",
    razaoSocial: "Vale Têxtil Indústria S.A.",
    regime: "lucro_real",
    situacao: "ativa",
    inscricaoMunicipal: "IM-2002",
    atividadePrincipal: "Indústria têxtil",
    municipio: "Brusque",
    uf: "SC",
  },
];

const COMUNICACOES_MOCK: Comunicacao[] = [
  {
    id: "cm-t15-a",
    protocolo: "CE-TEST-000001",
    casoId: "cs-2026-0142",
    contribuinteId: "ct-001",
    canal: "portal",
    status: "respondida",
    assunto: "Intimação por Portal · CS-2026-0142",
    conteudoResumo: "Solicitação de esclarecimento sobre divergência ISS 2Q/2025.",
    destinatario: { nome: "Nova Aurora Confecções Ltda.", portalUserId: "PU-NAC-001" },
    enviadaEm: "2026-07-01T14:30:00Z",
    entregueEm: "2026-07-01T14:30:12Z",
    cienciaEm: "2026-07-01T18:22:41Z",
    respondidaEm: "2026-07-02T15:47:00Z",
    prazoRespostaEm: "2026-07-11T23:59:59Z",
    respostaConteudo: "Anexamos relatório de conciliação.",
    eventos: [],
  },
  {
    id: "cm-t15-b",
    protocolo: "CE-TEST-000002",
    casoId: "cs-2026-0128",
    contribuinteId: "ct-002",
    canal: "email",
    status: "entregue",
    assunto: "Notificação por E-mail · CS-2026-0128",
    conteudoResumo: "Solicitação de contratos de exportação de serviço.",
    destinatario: { nome: "Vale Têxtil", email: "controladoria@valetextil.com.br" },
    enviadaEm: "2026-07-02T09:00:00Z",
    entregueEm: "2026-07-02T09:00:04Z",
    prazoRespostaEm: "2026-07-12T23:59:59Z",
    eventos: [],
  },
  {
    id: "cm-t15-c",
    protocolo: "CE-TEST-000003",
    casoId: "cs-2026-0126",
    contribuinteId: "ct-002",
    canal: "sms",
    status: "entregue",
    assunto: "SMS lembrete · CS-2026-0126",
    conteudoResumo: "Lembrete de prazo em 24h.",
    destinatario: { nome: "Vale Têxtil", telefoneMascarado: "+55 (47) *****-0000" },
    enviadaEm: "2026-07-03T08:00:00Z",
    entregueEm: "2026-07-03T08:00:03Z",
    eventos: [],
  },
];

function routeMock(path: string) {
  if (path === "/communications") return Promise.resolve(COMUNICACOES_MOCK);
  if (path === "/taxpayers") return Promise.resolve(CONTRIBUINTES_MOCK);
  return Promise.resolve(null);
}

describe("ComunicacoesPage — smoke T15", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => routeMock(path));
    useSession.getState().setRole("auditor");
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("renderiza o cabeçalho da Central e a toolbar de filtros", async () => {
    renderWithProviders(<ComunicacoesPage />);

    expect(screen.getByText(/Central de Comunicações Eletrônicas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar comunicações/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Canal$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Status$/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("CE-TEST-000001")).toBeInTheDocument();
    });
    expect(screen.getByText("CE-TEST-000002")).toBeInTheDocument();
    expect(screen.getByText("CE-TEST-000003")).toBeInTheDocument();
  });

  it("busca livre reduz o dataset visível", async () => {
    renderWithProviders(<ComunicacoesPage />);

    await waitFor(() => {
      expect(screen.getByText("CE-TEST-000001")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Buscar comunicações/i), {
      target: { value: "Nova Aurora" },
    });

    await waitFor(() => {
      expect(screen.getByText("CE-TEST-000001")).toBeInTheDocument();
      expect(screen.queryByText("CE-TEST-000002")).not.toBeInTheDocument();
      expect(screen.queryByText("CE-TEST-000003")).not.toBeInTheDocument();
    });
  });

  it("estado vazio (por filtro) aparece quando nada corresponde", async () => {
    renderWithProviders(<ComunicacoesPage />);

    await waitFor(() => {
      expect(screen.getByText("CE-TEST-000001")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Buscar comunicações/i), {
      target: { value: "termo-inexistente" },
    });

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma comunicação corresponde/i)).toBeInTheDocument();
    });
  });
});
