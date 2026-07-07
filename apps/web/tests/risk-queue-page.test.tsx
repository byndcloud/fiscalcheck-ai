import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RiskQueueItem } from "@fiscalcheck/shared-types";

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

import RiskQueuePage from "@/app/(dashboard)/fila-de-risco/page";

/*
  T08 — fila priorizada do auditor (RF03/FA03). Aceites cobertos:
  - a fila preserva a ordem do Agente de Score (desc) e a sinaliza com o
    rótulo aurora "Fila ordenada pelo Agente de Score";
  - cada linha traz o pill semáforo de risco e o CTA "Visão 360";
  - a segmentação filtra a carteira sem re-priorizar as linhas restantes.
*/

const filaMock: RiskQueueItem[] = [
  {
    contribuinteId: "ct-031",
    razaoSocial: "Construtora Vila Nova Empreendimentos S.A.",
    cnpjMascarado: "**.***.***/0001-54",
    setor: "41.20-4 · Construção de edifícios",
    regime: "lucro_real",
    situacao: "ativa",
    scoreValor: 93,
    nivel: "critico",
    valorPotencial: 486_200,
    statusTratamento: "candidato",
    casoId: "cs-2026-0165",
    tipoInconsistencia: "subdeclaracao",
    calculadoEm: "2026-07-02T06:30:00Z",
    modeloVersao: "risk-model-v2.4",
  },
  {
    contribuinteId: "ct-001",
    razaoSocial: "Metalúrgica Nova Aurora Ltda.",
    cnpjMascarado: "**.***.***/0001-42",
    setor: "25.11-0 · Fabricação de estruturas metálicas",
    regime: "lucro_presumido",
    situacao: "ativa",
    scoreValor: 82,
    nivel: "alto",
    valorPotencial: 84_500,
    statusTratamento: "sem_tratamento",
    tipoInconsistencia: "subdeclaracao",
    calculadoEm: "2026-07-02T06:30:00Z",
    modeloVersao: "risk-model-v2.4",
  },
  {
    contribuinteId: "ct-002",
    razaoSocial: "Tecelagem Vale do Itajaí Comércio ME",
    cnpjMascarado: "**.***.***/0001-73",
    setor: "13.30-8 · Fabricação de tecidos de malha",
    regime: "simples_nacional",
    situacao: "ativa",
    scoreValor: 44,
    nivel: "medio",
    statusTratamento: "notificado",
    casoId: "cs-2026-0128",
    tipoInconsistencia: "omissao",
    calculadoEm: "2026-07-02T06:30:00Z",
    modeloVersao: "risk-model-v2.4",
  },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RiskQueuePage />
    </QueryClientProvider>,
  );
}

describe("Fila de risco — T08", () => {
  beforeEach(() => {
    apiRequestMock.mockImplementation((path: unknown) => {
      if (path === "/ai/queue") return Promise.resolve(filaMock);
      return new Promise(() => {});
    });
  });

  afterEach(() => {
    cleanup();
    apiRequestMock.mockReset();
  });

  it("exibe o rótulo do Agente de Score e mantém a ordenação desc por score", async () => {
    renderPage();

    expect(await screen.findByText(/Fila ordenada pelo Agente de Score/i)).toBeInTheDocument();
    // O rótulo aurora fica fora do AsyncBoundary — aguarda a tabela resolver.
    await screen.findByText("Construtora Vila Nova Empreendimentos S.A.");

    const rows = screen.getAllByRole("row").slice(1); // descarta o cabeçalho
    const primeiraLinha = rows[0];
    const ultimaLinha = rows[rows.length - 1];
    if (!primeiraLinha || !ultimaLinha) throw new Error("Fila sem linhas renderizadas.");

    expect(
      within(primeiraLinha).getByText("Construtora Vila Nova Empreendimentos S.A."),
    ).toBeInTheDocument();
    expect(within(primeiraLinha).getByText("Crítico")).toBeInTheDocument();
    expect(
      within(ultimaLinha).getByText("Tecelagem Vale do Itajaí Comércio ME"),
    ).toBeInTheDocument();
  });

  it("cada linha oferece o CTA 'Visão 360' apontando para o detalhe do contribuinte", async () => {
    renderPage();

    const link = await screen.findByRole("link", {
      name: /Abrir visão 360 do contribuinte Metalúrgica Nova Aurora/i,
    });
    expect(link).toHaveAttribute("href", "/fila-de-risco/ct-001");
  });

  it("filtro de segmentação por nível reduz a fila sem re-priorizar", async () => {
    renderPage();
    await screen.findByText("Construtora Vila Nova Empreendimentos S.A.");

    const chipCritico = screen.getByRole("button", { name: /crítico/i });
    fireEvent.click(chipCritico);
    expect(chipCritico).toHaveAttribute("aria-pressed", "true");

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(1);
    const linha = rows[0];
    if (!linha) throw new Error("Fila filtrada sem linhas.");
    expect(
      within(linha).getByText("Construtora Vila Nova Empreendimentos S.A."),
    ).toBeInTheDocument();
  });
});
