import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AsyncBoundary } from "@/components/ui/async-boundary";
import { ApiError } from "@/lib/api-client";

/*
  T25 — AsyncBoundary: precedência de estados
   loading > error > empty > success
  e o botão "Tentar novamente" chama onRetry apenas quando fornecido.
*/

describe("AsyncBoundary", () => {
  afterEach(() => cleanup());

  it("renderiza o slot de loading quando isLoading=true", () => {
    render(
      <AsyncBoundary isLoading isError={false}>
        <p>ok</p>
      </AsyncBoundary>,
    );
    expect(screen.queryByText("ok")).toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renderiza o slot de loading customizado quando informado", () => {
    render(
      <AsyncBoundary isLoading isError={false} loading={<p>carregando-x</p>}>
        <p>ok</p>
      </AsyncBoundary>,
    );
    expect(screen.getByText("carregando-x")).toBeInTheDocument();
  });

  it("renderiza ErrorState com mensagem pt-BR quando isError=true", () => {
    render(
      <AsyncBoundary
        isLoading={false}
        isError
        error={new ApiError(500, "UNKNOWN_ERROR", "boom", "cid-x")}
      >
        <p>ok</p>
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/indisponível/i)).toBeInTheDocument();
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("chama onRetry ao clicar em Tentar novamente", () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary
        isLoading={false}
        isError
        error={new ApiError(500, "UNKNOWN_ERROR", "boom", "cid-x")}
        onRetry={onRetry}
      >
        <p>ok</p>
      </AsyncBoundary>,
    );
    const btn = screen.getByRole("button", { name: /tentar novamente/i });
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("prioriza erro sobre isEmpty", () => {
    render(
      <AsyncBoundary
        isLoading={false}
        isError
        isEmpty
        error={new ApiError(500, "UNKNOWN_ERROR", "boom", "cid-x")}
      >
        <p>ok</p>
      </AsyncBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renderiza EmptyState padrão quando isEmpty=true e não há dados", () => {
    render(
      <AsyncBoundary isLoading={false} isError={false} isEmpty>
        <p>oculto</p>
      </AsyncBoundary>,
    );
    expect(screen.queryByText("oculto")).toBeNull();
    expect(screen.getByText(/nada por aqui/i)).toBeInTheDocument();
  });

  it("renderiza children quando não está loading/error/empty", () => {
    render(
      <AsyncBoundary isLoading={false} isError={false} isEmpty={false}>
        <p>conteudo</p>
      </AsyncBoundary>,
    );
    expect(screen.getByText("conteudo")).toBeInTheDocument();
  });
});
