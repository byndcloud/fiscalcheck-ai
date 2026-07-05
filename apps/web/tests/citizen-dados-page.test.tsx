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

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import CitizenDadosPage from "@/app/(dashboard)/citizen/dados/page";
import { userProfilesFixture } from "@/mocks/fixtures/user-profiles";
import { useSession } from "@/stores/session-store";

/*
  T27+ — página "Meus dados" do contribuinte:
  - formulário pré-preenchido com os dados do serviço;
  - salvar dispara PUT /me/registration com os campos editáveis;
  - CPF e empresas vinculadas aparecem como somente leitura.
*/

function citizenProfile(): UserProfile {
  return {
    ...userProfilesFixture.cidadao,
    preferencias: { tamanhoFonte: "padrao", densidade: "confortavel", notificacoesAtivas: true },
  } as UserProfile;
}

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CitizenDadosPage (T27+)", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    useSession.getState().clear();
    useSession.getState().setRole("cidadao");
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("pré-preenche o formulário e mostra CPF/empresas como somente leitura", async () => {
    apiRequestMock.mockResolvedValue(citizenProfile());
    renderWithProviders(<CitizenDadosPage />);

    const telefone = await screen.findByLabelText("Telefone");
    expect(telefone).toHaveValue("(47) 98***-**33");
    expect(screen.getByLabelText("Endereço")).toHaveValue("Rua das Bromélias, 250 — Águas Claras");
    expect(screen.getByLabelText("Município")).toHaveValue("Brusque");
    expect(screen.getByLabelText("Estado (UF)")).toHaveValue("SC");

    expect(screen.getByText("***.***.***-33")).toBeInTheDocument();
    expect(screen.getByText("Tecelagem Vale do Itajaí Comércio ME")).toBeInTheDocument();
    // Campos somente leitura não têm input correspondente.
    expect(screen.queryByLabelText(/CPF/i)).toBeNull();
  });

  it("salvar dispara PUT /me/registration com os campos editáveis", async () => {
    apiRequestMock.mockImplementation((path: unknown) => {
      if (path === "/me/registration") {
        return Promise.resolve({
          ...userProfilesFixture.cidadao.dadosCadastrais,
          telefone: "(47) 90000-0000",
          atualizadoEm: new Date().toISOString(),
        });
      }
      return Promise.resolve(citizenProfile());
    });
    renderWithProviders(<CitizenDadosPage />);

    const telefone = await screen.findByLabelText("Telefone");
    fireEvent.change(telefone, { target: { value: "(47) 90000-0000" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/me/registration",
        expect.objectContaining({
          method: "PUT",
          body: expect.objectContaining({
            telefone: "(47) 90000-0000",
            endereco: "Rua das Bromélias, 250 — Águas Claras",
            municipio: "Brusque",
            uf: "SC",
          }),
        }),
      );
    });
  });

  it("valida telefone curto com mensagem em linguagem clara", async () => {
    apiRequestMock.mockResolvedValue(citizenProfile());
    renderWithProviders(<CitizenDadosPage />);

    const telefone = await screen.findByLabelText("Telefone");
    fireEvent.change(telefone, { target: { value: "999" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    expect(await screen.findByText(/Informe um telefone com DDD/i)).toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalledWith("/me/registration", expect.anything());
  });
});
