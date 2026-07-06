import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Caso, CtcFeed, NonFiler } from "@fiscalcheck/shared-types";

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

import CrossingPage from "@/app/(dashboard)/crossing/page";

/*
  T06/T07 — aceites de UI nas abas novas de /crossing:
  - Fora do radar: origem do indício visível, receita em destaque e
    ação "abrir caso candidato" com confirmação do auditor;
  - Monitoramento CTC: item alertado mostra a regra que disparou e o
    contador da janela "fato gerador → detecção".
*/

const nonFiler: NonFiler = {
  id: "nf-radar-001",
  nomeIndicado: "Facção Costura Ribeirão (nome de fachada)",
  documentoMascarado: "***.***.***-51 (CPF)",
  atividadePresumida: "14.12-6 · Confecção de peças do vestuário (facção)",
  municipio: "Brusque",
  receitaEstimada12m: 486_000,
  detectadoEm: "2026-06-27T09:40:00Z",
  status: "novo",
  indicios: [
    {
      fonte: "nfse_terceiros",
      resumo: "38 NFS-e de indústrias locais registram a facção como tomadora.",
      valorEstimado: 312_000,
      referencia: "38 NFS-e de 4 prestadores distintos",
    },
    {
      fonte: "meios_pagamento",
      resumo: "DIMP aponta recebimentos recorrentes em maquininha.",
      valorEstimado: 174_000,
      referencia: "DIMP — 12 competências",
    },
  ],
};

const feed: CtcFeed = {
  atualizadoEm: "2026-07-06T12:00:00Z",
  janelaMediaMinutos: 12.5,
  totalNotas: 54,
  totalAlertas: 1,
  lotes: [
    {
      id: "ctc-lote-0009",
      seq: 9,
      recebidoEm: "2026-07-06T11:59:52Z",
      notas: 21,
      valorTotal: 48_300,
      regrasAvaliadas: 15,
      processamentoSegundos: 2.2,
      alerta: {
        id: "ctc-al-0009",
        regra: "Salto de faturamento na competência",
        descricao: "Soma de NFS-e do mês superou em 3× a média móvel de 6 meses.",
        contribuinteId: "ct-007",
        contribuinteNome: "Restaurante Coração Catarinense Ltda.",
        janelaMinutos: 14,
        scoreIncremental: 82,
        sugestaoEnviada: false,
      },
    },
    {
      id: "ctc-lote-0008",
      seq: 8,
      recebidoEm: "2026-07-06T11:59:44Z",
      notas: 33,
      valorTotal: 61_900,
      regrasAvaliadas: 15,
      processamentoSegundos: 1.8,
    },
  ],
};

const casoAberto = {
  id: "cs-2026-r001",
  contribuinteId: "nf-radar-001",
  status: "candidato",
  criadoEm: "2026-07-06T12:01:00Z",
  atualizadoEm: "2026-07-06T12:01:00Z",
  divergenciaIds: [],
} as unknown as Caso;

function mockApi() {
  apiRequestMock.mockImplementation((path: unknown, options?: { method?: string }) => {
    if (path === "/crossing/non-filers") return Promise.resolve([nonFiler]);
    if (path === "/crossing/ctc/feed") return Promise.resolve(feed);
    if (path === "/crossing/non-filers/nf-radar-001/open-case" && options?.method === "POST") {
      return Promise.resolve({
        nonFiler: {
          ...nonFiler,
          status: "caso_aberto",
          casoId: casoAberto.id,
        },
        caso: casoAberto,
      });
    }
    return Promise.resolve([]);
  });
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CrossingPage />
    </QueryClientProvider>,
  );
}

function switchTab(name: RegExp) {
  const trigger = screen.getByRole("tab", { name });
  fireEvent.mouseDown(trigger, { button: 0 });
  fireEvent.click(trigger);
}

describe("Abas de /crossing (T06/T07)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    toastSuccess.mockReset();
    mockApi();
  });

  afterEach(() => {
    cleanup();
  });

  it("Fora do radar: origem do indício, receita em destaque e abertura de caso candidato confirmada", async () => {
    renderPage();
    switchTab(/Fora do radar/i);

    expect(await screen.findByText(/Facção Costura Ribeirão/)).toBeInTheDocument();
    // Origem do indício (aceite: qual fonte revelou)
    expect(screen.getByText("NFS-e de terceiros")).toBeInTheDocument();
    expect(screen.getByText("Meios de pagamento")).toBeInTheDocument();
    // Estimativa de receita não declarada em destaque
    expect(screen.getByText("R$ 486.000,00")).toBeInTheDocument();

    // CTA com confirmação do auditor (human-in-the-loop)
    fireEvent.click(screen.getByRole("button", { name: "Iniciar inscrição de ofício" }));
    expect(await screen.findByText("Confirmar e abrir caso candidato")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar e abrir caso candidato" }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/crossing/non-filers/nf-radar-001/open-case",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("CS-2026-R001"));
    });
  });

  it("Monitoramento CTC: contadores, regra que disparou e janela fato gerador → detecção", async () => {
    renderPage();
    switchTab(/Monitoramento CTC/i);

    // Contadores da janela
    expect(await screen.findByText("NFS-e processadas")).toBeInTheDocument();
    expect(screen.getByText("54")).toBeInTheDocument();
    expect(screen.getByText("12.5 min")).toBeInTheDocument();

    // Item alertado mostra a regra que disparou (aceite)
    expect(
      screen.getByText(/Alerta antecipado · regra: Salto de faturamento na competência/i),
    ).toBeInTheDocument();
    // Contador da janela "fato gerador → detecção" (aceite)
    expect(screen.getByText(/fato gerador → detecção: 14 min/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Sugerir autorregularização" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Ver casos abertos nos últimos minutos/i,
      }),
    ).toHaveAttribute("href", "/cases");
  });
});
