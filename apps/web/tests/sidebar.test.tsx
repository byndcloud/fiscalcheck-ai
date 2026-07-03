import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/app-shell/sidebar";
import { useSession } from "@/stores/session-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

const AUDITORIAL_LABELS = [
  "Dashboard",
  "Ingestão",
  "Detecção",
  "Risco & IA",
  "Esteira de agentes",
  "Casos",
  "Comunicações",
] as const;

const ALL_LABELS = [...AUDITORIAL_LABELS, "Cidadão", "Gerencial", "Governança"] as const;

describe("Sidebar — filtragem por papel", () => {
  beforeEach(() => {
    useSession.getState().clear();
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("auditor vê itens auditoriais e não vê Cidadão, Governança nem Gerencial", () => {
    useSession.getState().setRole("auditor");
    render(<Sidebar />);
    for (const label of AUDITORIAL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Cidadão")).toBeNull();
    expect(screen.queryByText("Governança")).toBeNull();
    expect(screen.queryByText("Gerencial")).toBeNull();
  });

  it("supervisor (gestor) vê auditoriais + Gerencial + Governança, mas não Cidadão", () => {
    useSession.getState().setRole("supervisor");
    render(<Sidebar />);
    for (const label of AUDITORIAL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("Gerencial")).toBeInTheDocument();
    expect(screen.getByText("Governança")).toBeInTheDocument();
    expect(screen.queryByText("Cidadão")).toBeNull();
  });

  it("admin vê todos os itens da navegação, exceto Cidadão", () => {
    useSession.getState().setRole("admin");
    render(<Sidebar />);
    for (const label of ALL_LABELS.filter((l) => l !== "Cidadão")) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Cidadão")).toBeNull();
  });

  it("cidadao vê apenas o portal do cidadão", () => {
    useSession.getState().setRole("cidadao");
    render(<Sidebar />);
    expect(screen.getByText("Cidadão")).toBeInTheDocument();
    for (const label of ALL_LABELS.filter((l) => l !== "Cidadão")) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("sem papel, nenhum item aparece", () => {
    render(<Sidebar />);
    for (const label of ALL_LABELS) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });
});
