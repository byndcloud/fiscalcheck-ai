import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@fiscalcheck/shared-types";

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

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: pushMock,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { UserMenu } from "@/components/app-shell/user-menu";
import { userProfilesFixture } from "@/mocks/fixtures/user-profiles";
import { useSession } from "@/stores/session-store";

/*
  T27 — menu do avatar:
  - mostra nome, papel e e-mail do usuário logado;
  - cidadão vê os dados cadastrais detalhados;
  - alterar preferência dispara PUT /me/preferences;
  - Sair limpa a sessão e volta pro login.
*/

const DEFAULT_PREFS = {
  tamanhoFonte: "padrao",
  densidade: "confortavel",
  notificacoesAtivas: true,
} as const;

function profileFor(role: "auditor" | "cidadao"): UserProfile {
  return { ...userProfilesFixture[role], preferencias: { ...DEFAULT_PREFS } };
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("UserMenu (T27)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    pushMock.mockReset();
    useSession.getState().clear();
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("mostra nome, papel e e-mail do auditor no popover", async () => {
    apiRequestMock.mockResolvedValue(profileFor("auditor"));
    useSession.getState().setRole("auditor");

    renderWithProviders(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));

    expect(await screen.findByText("marina.steinbach@brusque.sc.gov.br")).toBeInTheDocument();
    expect(screen.getAllByText("Marina Coelho Steinbach").length).toBeGreaterThan(0);
    // Papel aparece no trigger e no cabeçalho do popover.
    expect(screen.getAllByText(/Auditor fiscal/i).length).toBeGreaterThan(0);
    expect(screen.getByText("AF-2031-0482")).toBeInTheDocument();
    // Auditor não tem dados cadastrais de contribuinte.
    expect(screen.queryByText(/Dados cadastrais/i)).not.toBeInTheDocument();
  });

  it("cidadã vê o atalho para ver e editar os dados cadastrais", async () => {
    apiRequestMock.mockResolvedValue(profileFor("cidadao"));
    useSession.getState().setRole("cidadao");

    renderWithProviders(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));

    const dadosLink = await screen.findByRole("link", { name: /Meus dados cadastrais/i });
    expect(dadosLink).toHaveAttribute("href", "/citizen/dados");
  });

  it("alterar tamanho da letra dispara PUT /me/preferences", async () => {
    apiRequestMock.mockImplementation((path: unknown) => {
      if (path === "/me/preferences") {
        return Promise.resolve({ ...DEFAULT_PREFS, tamanhoFonte: "grande" });
      }
      return Promise.resolve(profileFor("auditor"));
    });
    useSession.getState().setRole("auditor");

    renderWithProviders(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));

    const grandeButton = await screen.findByRole("button", { name: "Grande" });
    fireEvent.click(grandeButton);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/me/preferences",
        expect.objectContaining({
          method: "PUT",
          body: { role: "auditor", preferencias: { tamanhoFonte: "grande" } },
        }),
      );
    });
  });

  it("Sair limpa a sessão e navega para /login", async () => {
    apiRequestMock.mockResolvedValue(profileFor("auditor"));
    useSession.getState().setRole("auditor");

    renderWithProviders(<UserMenu />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu do usuário/i }));

    const sairButton = await screen.findByRole("button", { name: /Sair/i });
    fireEvent.click(sairButton);

    expect(useSession.getState().role).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
