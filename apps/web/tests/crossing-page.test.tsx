import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso, Contribuinte, Divergencia, NFSe, Score } from "@fiscalcheck/shared-types";

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

import CrossingPage from "@/app/(dashboard)/crossing/page";

/*
  T05 — aceite da tela de Cruzamento:
  - badge AGENTE na origem e diferença (R$) em destaque;
  - chips de filtro reduzem a lista;
  - clicar numa divergência abre o detalhe com lado a lado
    declarado × NFS-e, evidências e link para o Dossiê (T13);
  - painel "Por que este score?" (T09) no detalhe quando há score.
*/

const divergencias: Divergencia[] = [
  {
    id: "dv-001",
    contribuinteId: "ct-001",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 4,
    valor: 84_500,
    valorDeclarado: 120_500,
    valorApurado: 205_000,
    competencia: "2026-05",
    descricao: "Valor declarado menor que a soma de NFS-e do período.",
    detectadoEm: "2026-07-01T09:15:00Z",
    evidencias: ["nf-1041"],
  },
  {
    id: "dv-005",
    contribuinteId: "ct-001",
    tipo: "socio_vinculado",
    origem: "grafo_socios",
    severidade: 3,
    valor: null,
    descricao: "Sócio vinculado a contribuinte suspenso.",
    detectadoEm: "2026-07-01T18:11:00Z",
    evidencias: ["ct-004"],
  },
];

const contribuinte: Contribuinte = {
  id: "ct-001",
  cnpjMascarado: "**.***.***/0001-42",
  razaoSocial: "Metalúrgica Nova Aurora Ltda.",
  inscricaoMunicipal: "12345-6",
  regime: "lucro_presumido",
  situacao: "ativa",
  atividadePrincipal: "25.11-0 · Fabricação de estruturas metálicas",
  municipio: "Brusque",
  uf: "SC",
} as Contribuinte;

const caso = {
  id: "cs-2026-0121",
  contribuinteId: "ct-001",
  status: "em_analise",
  criadoEm: "2026-06-20T09:00:00Z",
  atualizadoEm: "2026-07-01T09:00:00Z",
  scoreValor: 82,
  divergenciaIds: ["dv-001"],
} as Caso;

const score: Score = {
  contribuinteId: "ct-001",
  valor: 82,
  nivel: "alto",
  calculadoEm: "2026-07-01T06:00:00Z",
  modeloVersao: "risk-model@2.3.1",
  fatores: [
    {
      nome: "Diferença declarado × NFS-e recorrente",
      peso: 0.4,
      contribuicao: 38,
      evidencia: "3 competências consecutivas com diferença crescente.",
      origem: "cruzamento",
    },
  ],
};

const nota: NFSe = {
  id: "nf-1041",
  numero: "2026001041",
  serie: "A",
  competencia: "2026-05",
  dataEmissao: "2026-05-14T10:12:00Z",
  prestadorId: "ct-001",
  tomadorId: "ct-006",
  valorServicos: 205_000,
  baseCalculo: 205_000,
  aliquota: 3,
  iss: 6_150,
  situacao: "emitida",
  descricaoServico: "Serviço de usinagem — lote 05/2026.",
};

function mockApi() {
  apiRequestMock.mockImplementation((path: unknown) => {
    switch (path) {
      case "/crossing/divergences":
        return Promise.resolve(divergencias);
      case "/taxpayers":
        return Promise.resolve([contribuinte]);
      case "/cases":
        return Promise.resolve([caso]);
      case "/ai/scores":
        return Promise.resolve([score]);
      case "/nfse":
        return Promise.resolve([nota]);
      default:
        return Promise.resolve([]);
    }
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CrossingPage />
    </QueryClientProvider>,
  );
}

describe("CrossingPage (T05)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    mockApi();
  });

  afterEach(() => {
    cleanup();
  });

  it("lista com razão social, badge AGENTE e diferença em destaque", async () => {
    renderPage();

    expect(await screen.findAllByText("Metalúrgica Nova Aurora Ltda.")).toHaveLength(2);
    expect(screen.getAllByText("AGENTE").length).toBeGreaterThan(0);
    expect(screen.getByText("R$ 84.500,00")).toBeInTheDocument();
    expect(screen.getByText("não monetária")).toBeInTheDocument();
    expect(screen.getByText("2 de 2 divergências")).toBeInTheDocument();
  });

  it("chips de tipo filtram a lista (badge do tipo de inconsistência)", async () => {
    renderPage();
    await screen.findAllByText("Metalúrgica Nova Aurora Ltda.");

    fireEvent.click(screen.getByRole("button", { name: "Sócio vinculado", pressed: false }));

    await waitFor(() => {
      expect(screen.getByText("1 de 2 divergências")).toBeInTheDocument();
    });
    expect(screen.queryByText("R$ 84.500,00")).toBeNull();
  });

  it("detalhe abre com lado a lado, cálculo, evidências NFS-e, score (T09) e link para o dossiê", async () => {
    renderPage();
    await screen.findAllByText("Metalúrgica Nova Aurora Ltda.");

    const botoes = screen.getAllByRole("button", { name: "Ver detalhe" });
    expect(botoes[0]).toBeDefined();
    fireEvent.click(botoes[0] as HTMLElement);

    expect(await screen.findByText("Declarado × documentado em NFS-e")).toBeInTheDocument();
    // Aparece no card e repetido no cálculo explícito da diferença.
    expect(screen.getAllByText("R$ 120.500,00")).toHaveLength(2);
    expect(screen.getAllByText("R$ 205.000,00").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Diferença apurada pelo cruzamento declarado × NFS-e"),
    ).toBeInTheDocument();

    // Evidência primária nominal
    expect(await screen.findByText(/NFS-e 2026001041/)).toBeInTheDocument();

    // T09 — explicabilidade no detalhe
    expect(screen.getByText("Por que este score?")).toBeInTheDocument();

    // Ponte para o dossiê (T13)
    const link = screen.getByRole("link", { name: /Abrir dossiê do caso/i });
    expect(link).toHaveAttribute("href", "/cases?caso=cs-2026-0121");
  });
});
