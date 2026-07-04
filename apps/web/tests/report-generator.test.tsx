import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KpiTrend, MetaPiloto, SusAvaliacao } from "@fiscalcheck/shared-types";

const generateReportMock = vi.fn();

vi.mock("@/lib/reports/generate-report", () => ({
  generateReport: (...args: unknown[]) => generateReportMock(...args),
  newReportCorrelationId: () => "cid-rel-fixed",
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

import { ReportGeneratorModal } from "@/components/analytics/report-generator-modal";
import { useSession } from "@/stores/session-store";

const KPI: KpiTrend = {
  key: "casosAbertos",
  label: "Casos em aberto",
  unidade: "int",
  valor: 30,
  variacaoPct: -5,
  positive: true,
  serie: [40, 35, 32, 30],
};
const META: MetaPiloto = {
  id: "meta-usabilidade",
  codigo: "usabilidade",
  nome: "Usabilidade",
  descricao: "SUS",
  unidade: "score",
  baseline: 60,
  atual: 70,
  alvo: 80,
  progressoPct: 0.5,
  status: "em_risco",
  prazoEm: "2026-12-30T23:59:59Z",
  atualizadoEm: "2026-07-04T00:00:00Z",
};
const SUS: SusAvaliacao = {
  id: "sus-1",
  respondidoPor: "Auditor",
  respondidoEm: "2026-07-01T00:00:00Z",
  respostas: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
  score: 100,
};

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("ReportGeneratorModal — passos e payload (T17)", () => {
  beforeEach(() => {
    generateReportMock.mockReset();
    generateReportMock.mockResolvedValue({
      filename: "validacao-20260604-20260704.pdf",
      response: {
        filename: "validacao-20260604-20260704.pdf",
        correlationId: "cid-rel-fixed",
        bytesMock: 1024,
        emitidoEm: "2026-07-04T12:00:00Z",
      },
    });
    useSession.getState().setRole("supervisor", { id: "u-1", displayName: "Gestora Ana" });
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
    vi.clearAllMocks();
  });

  it("navega passo 1 → 2 → 3 e chama generateReport com o payload correto", async () => {
    renderWithProviders(
      <ReportGeneratorModal
        open
        onOpenChange={() => {}}
        kpis={[KPI]}
        metas={[META]}
        susAvaliacoes={[SUS]}
      />,
    );

    // Passo 1 aparece
    expect(screen.getByText(/1 · Tipo e período/i)).toBeInTheDocument();

    // Continuar → passo 2
    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    await waitFor(() => expect(screen.getByText(/2 · Seções a incluir/i)).toBeInTheDocument());

    // Continuar → passo 3
    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    await waitFor(() => expect(screen.getByText(/3 · Confirmação/i)).toBeInTheDocument());

    // Clica em Gerar PDF
    fireEvent.click(screen.getByRole("button", { name: /Gerar PDF/i }));

    await waitFor(() => expect(generateReportMock).toHaveBeenCalledTimes(1));
    const [callArgs] = generateReportMock.mock.calls[0] as [
      {
        formato: "pdf" | "xlsx";
        data: { tipo: string; secoes: string[]; correlationId: string };
        actor: { role: string; displayName: string };
      },
    ];
    expect(callArgs.formato).toBe("pdf");
    expect(callArgs.data.tipo).toBe("validacao");
    expect(callArgs.data.correlationId).toBe("cid-rel-fixed");
    expect(callArgs.data.secoes.length).toBeGreaterThan(0);
    expect(callArgs.actor.role).toBe("supervisor");
    expect(callArgs.actor.displayName).toBe("Gestora Ana");
  });

  it("desabilita 'Gerar PDF' quando nenhuma seção está marcada", async () => {
    renderWithProviders(
      <ReportGeneratorModal
        open
        onOpenChange={() => {}}
        kpis={[KPI]}
        metas={[META]}
        susAvaliacoes={[SUS]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));
    // Desmarca todas as seções pré-selecionadas
    const checkboxes = await screen.findAllByRole("checkbox");
    for (const cb of checkboxes) {
      if ((cb as HTMLInputElement).checked) {
        fireEvent.click(cb);
      }
    }
    fireEvent.click(screen.getByRole("button", { name: /^Continuar$/i }));

    const pdfBtn = await screen.findByRole("button", { name: /Gerar PDF/i });
    expect(pdfBtn).toBeDisabled();
  });
});
