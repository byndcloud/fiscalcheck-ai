import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/app-shell/sidebar";
import { useSession } from "@/stores/session-store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

const ALL_LABELS = [
  "Dashboard",
  "Ingestão",
  "Detecção",
  "Risco & IA",
  "Casos",
  "Cidadão",
  "Gerencial",
  "Governança",
] as const;

describe("Sidebar — filtragem por papel", () => {
  beforeEach(() => {
    useSession.getState().clear();
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("auditor não vê Governança nem Gerencial", () => {
    useSession.getState().setRole("auditor");
    render(<Sidebar />);
    for (const label of ["Dashboard", "Ingestão", "Detecção", "Risco & IA", "Casos", "Cidadão"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Governança")).toBeNull();
    expect(screen.queryByText("Gerencial")).toBeNull();
  });

  it("admin vê todos os itens da navegação", () => {
    useSession.getState().setRole("admin");
    render(<Sidebar />);
    for (const label of ALL_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
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
