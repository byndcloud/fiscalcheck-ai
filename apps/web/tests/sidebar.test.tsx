import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathnameMock = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
}));

import { Sidebar } from "@/components/app-shell/sidebar";
import { useSession } from "@/stores/session-store";

const AUDITORIAL_LABELS = [
  "Dashboard",
  "Ingestão",
  "Detecção",
  "Risco & IA",
  "Esteira de agentes",
  "Casos",
  "Comunicações",
  "Treinamento",
] as const;

const ALL_LABELS = [
  ...AUDITORIAL_LABELS,
  "Cidadão",
  "Meus dados",
  "Painel do Gestor",
  "Governança",
] as const;

describe("Sidebar — filtragem por papel", () => {
  beforeEach(() => {
    pathnameMock = "/dashboard";
    useSession.getState().clear();
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("auditor vê itens auditoriais e não vê Cidadão, Meus dados, Governança nem Painel do Gestor", () => {
    useSession.getState().setRole("auditor");
    render(<Sidebar />);
    for (const label of AUDITORIAL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Cidadão")).toBeNull();
    expect(screen.queryByText("Meus dados")).toBeNull();
    expect(screen.queryByText("Governança")).toBeNull();
    expect(screen.queryByText("Painel do Gestor")).toBeNull();
  });

  it("supervisor (gestor) vê auditoriais + Painel do Gestor + Governança, mas não Cidadão", () => {
    useSession.getState().setRole("supervisor");
    render(<Sidebar />);
    for (const label of AUDITORIAL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Painel do Gestor")).toBeInTheDocument();
    expect(screen.getByText("Governança")).toBeInTheDocument();
    expect(screen.queryByText("Cidadão")).toBeNull();
  });

  it("admin vê todos os itens da navegação, exceto os do cidadão", () => {
    useSession.getState().setRole("admin");
    render(<Sidebar />);
    for (const label of ALL_LABELS.filter((l) => l !== "Cidadão" && l !== "Meus dados")) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Cidadão")).toBeNull();
    expect(screen.queryByText("Meus dados")).toBeNull();
  });

  it("cidadao vê o portal do cidadão e o item Meus dados", () => {
    useSession.getState().setRole("cidadao");
    render(<Sidebar />);
    expect(screen.getByText("Cidadão")).toBeInTheDocument();
    const meusDados = screen.getByRole("link", { name: /Meus dados/i });
    expect(meusDados).toHaveAttribute("href", "/citizen/dados");
    for (const label of ALL_LABELS.filter((l) => l !== "Cidadão" && l !== "Meus dados")) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("em /citizen/dados, apenas Meus dados fica ativo (não o item Cidadão)", () => {
    pathnameMock = "/citizen/dados";
    useSession.getState().setRole("cidadao");
    render(<Sidebar />);
    const meusDados = screen.getByRole("link", { name: /Meus dados/i });
    const cidadao = screen.getByRole("link", { name: /Portal do contribuinte/i });
    expect(meusDados).toHaveAttribute("aria-current", "page");
    expect(cidadao).not.toHaveAttribute("aria-current");
  });

  it("sem papel, nenhum item aparece", () => {
    render(<Sidebar />);
    for (const label of ALL_LABELS) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });
});
