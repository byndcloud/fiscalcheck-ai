import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentCard } from "@/components/agents/agent-card";
import type { PipelineAgent } from "@/lib/mocks/agents";

const baseAgent: PipelineAgent = {
  id: "FA05",
  nome: "Agente de Score de Risco",
  modulo: "3 · IA Preditiva",
  descricao: "Calcula o score de risco preditivo por contribuinte.",
  status: "ativo",
  ultimaExecucao: new Date().toISOString(),
  itensProcessados: 1234,
  fila: 7,
  tempoMedioMs: 640,
  eventos: [],
};

describe("AgentCard", () => {
  it("mostra nome, código, módulo e métricas do agente", () => {
    render(<AgentCard agent={baseAgent} onSelect={vi.fn()} />);

    expect(screen.getByText("Agente de Score de Risco")).toBeInTheDocument();
    expect(screen.getByText("FA05")).toBeInTheDocument();
    expect(screen.getByText("3 · IA Preditiva")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("640 ms")).toBeInTheDocument();
  });

  it("chama onSelect com o id do agente ao clicar", () => {
    const onSelect = vi.fn();
    render(<AgentCard agent={baseAgent} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Agente de Score de Risco/ }));

    expect(onSelect).toHaveBeenCalledWith("FA05");
  });

  it("renderiza como <button> nativo, focável e acionável por teclado por padrão", () => {
    render(<AgentCard agent={baseAgent} onSelect={vi.fn()} />);

    const button = screen.getByRole("button", { name: /Agente de Score de Risco/ });
    expect(button.tagName).toBe("BUTTON");
    expect(button).not.toHaveAttribute("tabindex", "-1");
  });

  it("reflete status de erro no rótulo", () => {
    render(<AgentCard agent={{ ...baseAgent, status: "erro" }} onSelect={vi.fn()} />);
    expect(screen.getByText("Erro")).toBeInTheDocument();
  });
});
