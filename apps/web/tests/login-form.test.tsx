import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";
import { useSession } from "@/stores/session-store";

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

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("LoginForm — fluxo mock", () => {
  beforeEach(() => {
    useSession.getState().clear();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    useSession.getState().clear();
  });

  it("perfil default do submit é auditor e redireciona para /dashboard", async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText(/seu\.email|CPF\/CNPJ/i), {
      target: { value: "auditor@brusque.sc.gov.br" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "senha-teste" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(useSession.getState().role).toBe("auditor");
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("valida senha curta com mensagem em pt-BR", async () => {
    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText(/seu\.email|CPF\/CNPJ/i), {
      target: { value: "auditor@brusque.sc.gov.br" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Entrar$/i }));

    expect(
      await screen.findByText(/Informe uma senha de ao menos 4 caracteres/i),
    ).toBeInTheDocument();
    expect(useSession.getState().role).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
