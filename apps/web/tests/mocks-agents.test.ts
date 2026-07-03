import { describe, expect, it } from "vitest";

import { type PipelineAgent, getInitialAgents, tickAgents } from "@/lib/mocks/agents";

describe("mock da esteira de agentes (T10)", () => {
  it("gera exatamente os 11 agentes FA01–FA11, sem duplicatas", () => {
    const agents = getInitialAgents();
    expect(agents).toHaveLength(11);

    const ids = agents.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(11);
    for (let i = 1; i <= 11; i += 1) {
      expect(ids).toContain(`FA${String(i).padStart(2, "0")}`);
    }
  });

  it("cada agente nasce com pelo menos um evento no histórico", () => {
    const agents = getInitialAgents();
    for (const agent of agents) {
      expect(agent.eventos.length).toBeGreaterThan(0);
    }
  });

  it("tickAgents preserva a lista de 11 agentes e nunca deixa métricas negativas", () => {
    let agents = getInitialAgents();

    for (let tick = 0; tick < 30; tick += 1) {
      const result = tickAgents(agents);
      expect(result.agents).toHaveLength(11);

      for (const agent of result.agents) {
        expect(agent.fila).toBeGreaterThanOrEqual(0);
        expect(agent.itensProcessados).toBeGreaterThanOrEqual(0);
        expect(["ativo", "ocioso", "erro"]).toContain(agent.status);
        expect(agent.eventos.length).toBeLessThanOrEqual(20);
      }

      for (const erro of result.novosErros) {
        expect(result.agents.find((agent) => agent.id === erro.agentId)?.status).toBe("erro");
      }

      agents = result.agents;
    }
  });

  it("um agente que entra em erro aparece em novosErros nesse tick", () => {
    const agents: PipelineAgent[] = getInitialAgents().map((agent) => ({
      ...agent,
      status: "ativo",
    }));

    let sawNewError = false;
    let current: PipelineAgent[] = agents;
    for (let tick = 0; tick < 200 && !sawNewError; tick += 1) {
      const result = tickAgents(current);
      if (result.novosErros.length > 0) {
        sawNewError = true;
        expect(result.novosErros[0]).toMatchObject({
          agentId: expect.any(String),
          agentNome: expect.any(String),
          mensagem: expect.any(String),
          timestamp: expect.any(String),
        });
      }
      current = result.agents;
    }

    expect(sawNewError).toBe(true);
  });
});
