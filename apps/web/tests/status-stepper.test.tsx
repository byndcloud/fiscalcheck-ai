import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatusStepper } from "@/components/communications/status-stepper";

describe("StatusStepper (T15)", () => {
  afterEach(cleanup);

  it("marca 'enviada' como o passo atual quando o status é 'enviada'", () => {
    render(<StatusStepper status="enviada" />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("aria-current", "step");
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i]).not.toHaveAttribute("aria-current");
    }
  });

  it("marca 'entregue' como corrente quando o status é 'entregue'", () => {
    render(<StatusStepper status="entregue" />);
    const items = screen.getAllByRole("listitem");
    // 0=enviada (completed), 1=entregue (current), 2=ciencia, 3=respondida
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
  });

  it("renderiza o passo 'respondida' como corrente quando o status é 'respondida'", () => {
    render(<StatusStepper status="respondida" />);
    const items = screen.getAllByRole("listitem");
    expect(items[3]).toHaveAttribute("aria-current", "step");
  });

  it("sinaliza falha sem marcar nenhum passo como corrente", () => {
    render(<StatusStepper status="falha" />);
    const items = screen.getAllByRole("listitem");
    for (const it of items) {
      expect(it).not.toHaveAttribute("aria-current");
    }
  });

  it("exibe timestamps quando fornecidos nos passos corretos", () => {
    render(
      <StatusStepper
        status="entregue"
        timestamps={{
          enviada: "2026-07-01T14:30:00Z",
          entregue: "2026-07-01T14:30:12Z",
        }}
      />,
    );
    // Data no formato pt-BR aparece pelo menos duas vezes (enviada e entregue).
    const matches = screen.getAllByText(/01\/07\/2026/i);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("no modo compact usa labels curtos", () => {
    render(<StatusStepper status="ciencia" variant="compact" />);
    expect(screen.getByText("Env.")).toBeInTheDocument();
    expect(screen.getByText("Ent.")).toBeInTheDocument();
    expect(screen.getByText("Ciência")).toBeInTheDocument();
    expect(screen.getByText("Resp.")).toBeInTheDocument();
  });
});
