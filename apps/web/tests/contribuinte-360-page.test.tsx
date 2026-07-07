import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Contribuinte360 } from "@fiscalcheck/shared-types";

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

vi.mock("next/navigation", () => ({
  useParams: () => ({ contribuinteId: "ct-001" }),
}));

import Contribuinte360Page from "@/app/(dashboard)/fila-de-risco/[contribuinteId]/page";

/*
  T08 — Visão 360 do contribuinte (RF03/FA03). Aceites cobertos:
  - o medidor de risco 0–100 expõe o valor de forma acessível (role meter);
  - o painel "Por que este score?" (T09) vem embutido na visão geral;
  - as abas dão acesso a declarações, dívida/pagamentos e casos vinculados,
    com o dossiê do caso a um clique (human-in-the-loop).
*/

const visao360Mock: Contribuinte360 = {
  contribuinte: {
    id: "ct-001",
    cnpjMascarado: "**.***.***/0001-42",
    razaoSocial: "Metalúrgica Nova Aurora Ltda.",
    nomeFantasia: "Nova Aurora",
    inscricaoMunicipal: "12345-6",
    regime: "lucro_presumido",
    situacao: "ativa",
    atividadePrincipal: "25.11-0 · Fabricação de estruturas metálicas",
    municipio: "Brusque",
    uf: "SC",
    endereco: "Rua Fictícia, 123 — Centro",
    socios: [
      {
        nome: "Marina G.",
        cpfMascarado: "***.***.***-11",
        participacao: 60,
        qualificacao: "Administradora",
      },
    ],
  },
  score: {
    contribuinteId: "ct-001",
    valor: 82,
    nivel: "alto",
    calculadoEm: "2026-07-02T06:30:00Z",
    modeloVersao: "risk-model-v2.4",
    proximaAcaoRecomendada: "Abrir caso de fiscalização.",
    fatores: [
      {
        nome: "Subdeclaração recorrente ISS",
        peso: 0.4,
        contribuicao: 33,
        evidencia: "3 competências abaixo da média setorial.",
        origem: "cruzamento",
      },
    ],
  },
  scoreHistorico: [
    { data: "2026-06-08", valor: 78, nivel: "alto", modeloVersao: "risk-model-v2.3.1" },
    { data: "2026-07-02", valor: 82, nivel: "alto", modeloVersao: "risk-model-v2.4" },
  ],
  declaracoes: [
    {
      competencia: "2026-05",
      fonte: "des",
      receitaDeclarada: 150_000,
      issApurado: 3_000,
      status: "entregue",
    },
  ],
  nfse: [],
  dividaAtiva: [
    {
      id: "da-001-01",
      cda: "CDA-2023-****41",
      exercicio: 2023,
      tributo: "iss",
      valorAtualizado: 38_400,
      situacao: "inscrita",
      inscritaEm: "2023-11-18",
    },
  ],
  pagamentos: [],
  casos: [
    {
      id: "cs-2026-0199",
      contribuinteId: "ct-001",
      status: "em_analise",
      criadoEm: "2026-06-20T08:00:00Z",
      atualizadoEm: "2026-07-01T10:00:00Z",
      divergenciaIds: [],
      valorPotencial: 84_500,
    },
  ],
};

const openDossieMock = vi.fn();

vi.mock("@/stores/dossie-store", () => ({
  useDossieStore: (selector: (state: { openDossie: (id: string) => void }) => unknown) =>
    selector({ openDossie: openDossieMock }),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Contribuinte360Page />
    </QueryClientProvider>,
  );
}

describe("Visão 360 do contribuinte — T08", () => {
  beforeEach(() => {
    apiRequestMock.mockImplementation((path: unknown) => {
      if (path === "/taxpayers/ct-001/360") return Promise.resolve(visao360Mock);
      return new Promise(() => {});
    });
  });

  afterEach(() => {
    cleanup();
    apiRequestMock.mockReset();
    openDossieMock.mockReset();
  });

  it("renderiza o medidor de risco acessível e o painel T09 embutido", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Metalúrgica Nova Aurora Ltda." }),
    ).toBeInTheDocument();

    const gauge = screen.getByRole("meter", { name: /Score de risco: 82 de 100/i });
    expect(gauge).toHaveAttribute("aria-valuenow", "82");

    // T09 — "Por que este score?" embutido na aba Visão geral.
    expect(screen.getByText("Subdeclaração recorrente ISS")).toBeInTheDocument();
    expect(
      screen.getByText(/registrada para defesa perante órgãos de controle/i),
    ).toBeInTheDocument();
  });

  it("aba de casos vinculados abre o dossiê do caso selecionado", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Metalúrgica Nova Aurora Ltda." });

    // Radix Tabs seleciona no mousedown — mesmo padrão de crossing-tabs.test.tsx.
    const trigger = screen.getByRole("tab", { name: /Casos vinculados/i });
    fireEvent.mouseDown(trigger, { button: 0 });
    fireEvent.click(trigger);

    expect(await screen.findByText("CS-2026-0199")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Abrir dossiê/i }));
    expect(openDossieMock).toHaveBeenCalledWith("cs-2026-0199");
  });

  it("exibe erro amigável quando o contribuinte não existe", async () => {
    const { ApiError } = await import("@/lib/api-client");
    apiRequestMock.mockRejectedValue(
      new ApiError(404, "taxpayer_not_found", "Contribuinte não encontrado.", "cor-t08-1"),
    );

    renderPage();

    expect(await screen.findByText("Contribuinte não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar para a fila de risco/i })).toBeInTheDocument();
  });
});
