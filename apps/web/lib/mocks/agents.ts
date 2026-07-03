/**
 * Mock da esteira de agentes especialistas (T10 — POC do edital).
 *
 * 100% fictício: não há lista oficial de FA01–FA11 no projeto ainda. O
 * mapeamento abaixo reaproveita os nomes/papéis de agente já documentados em
 * docs/modules/*.md, apenas numerados para a demo. Ajuste quando houver uma
 * especificação oficial dos 11 agentes.
 */

export type AgentStatus = "ativo" | "ocioso" | "erro";

export type ExecutionEventType = "sucesso" | "erro" | "info";

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  tipo: ExecutionEventType;
  mensagem: string;
  itensProcessados: number;
  duracaoMs: number;
}

export interface PipelineAgent {
  id: string;
  nome: string;
  modulo: string;
  descricao: string;
  status: AgentStatus;
  ultimaExecucao: string;
  itensProcessados: number;
  fila: number;
  tempoMedioMs: number;
  eventos: ExecutionEvent[];
}

export interface AgentErrorAlert {
  agentId: string;
  agentNome: string;
  mensagem: string;
  timestamp: string;
}

export interface AgentsTickResult {
  agents: PipelineAgent[];
  novosErros: AgentErrorAlert[];
}

type AgentBlueprint = Pick<PipelineAgent, "id" | "nome" | "modulo" | "descricao"> & {
  statusInicial: AgentStatus;
  itensProcessadosInicial: number;
  filaInicial: number;
  tempoMedioMsInicial: number;
};

const AGENT_BLUEPRINTS: readonly AgentBlueprint[] = [
  {
    id: "FA01",
    nome: "Agente 24/7 de Ingestão",
    modulo: "1 · Ingestão e Qualidade",
    descricao: "Monitora novas cargas (NFS-e, DIMP, ECD, DEFIS, PGDAS) e executa o ETL multifonte.",
    statusInicial: "ativo",
    itensProcessadosInicial: 18_420,
    filaInicial: 34,
    tempoMedioMsInicial: 820,
  },
  {
    id: "FA02",
    nome: "Agente Validador de Qualidade",
    modulo: "1 · Ingestão e Qualidade",
    descricao: "Valida esquema e qualidade das cargas, sinalizando falhas antes da análise.",
    statusInicial: "ativo",
    itensProcessadosInicial: 17_990,
    filaInicial: 12,
    tempoMedioMsInicial: 410,
  },
  {
    id: "FA03",
    nome: "Agente Gatekeeper Fiscal",
    modulo: "2 · Cruzamento e Detecção",
    descricao: "Cruza declarado vs. NFS-e e abre casos candidatos com evidências.",
    statusInicial: "ativo",
    itensProcessadosInicial: 6_204,
    filaInicial: 21,
    tempoMedioMsInicial: 1_340,
  },
  {
    id: "FA04",
    nome: "Agente de Graph Analytics",
    modulo: "2 · Cruzamento e Detecção",
    descricao: "Mapeia redes societárias, endereços e vínculos entre entidades.",
    statusInicial: "ocioso",
    itensProcessadosInicial: 3_012,
    filaInicial: 0,
    tempoMedioMsInicial: 2_150,
  },
  {
    id: "FA05",
    nome: "Agente de Score de Risco",
    modulo: "3 · IA Preditiva",
    descricao: "Calcula o score de risco preditivo por contribuinte a cada nova evidência.",
    statusInicial: "ativo",
    itensProcessadosInicial: 9_875,
    filaInicial: 44,
    tempoMedioMsInicial: 640,
  },
  {
    id: "FA06",
    nome: "Agente XAI",
    modulo: "3 · IA Preditiva",
    descricao: "Gera explicabilidade (XAI) para cada score, com fatores e evidências.",
    statusInicial: "ocioso",
    itensProcessadosInicial: 9_120,
    filaInicial: 3,
    tempoMedioMsInicial: 510,
  },
  {
    id: "FA07",
    nome: "Agente de Calibragem",
    modulo: "3 · IA Preditiva",
    descricao: "Active learning: reincorpora feedback do auditor no retrain e na calibragem.",
    statusInicial: "ativo",
    itensProcessadosInicial: 1_284,
    filaInicial: 6,
    tempoMedioMsInicial: 3_020,
  },
  {
    id: "FA08",
    nome: "Agente Orquestrador de Fiscalização",
    modulo: "4 · Gestão da Fiscalização",
    descricao: "Recomenda a próxima melhor ação a partir da fila priorizada por risco.",
    statusInicial: "ativo",
    itensProcessadosInicial: 2_945,
    filaInicial: 17,
    tempoMedioMsInicial: 980,
  },
  {
    id: "FA09",
    nome: "Agente Multicanal Cidadão",
    modulo: "4 · Gestão da Fiscalização",
    descricao: "Notifica o contribuinte e conduz o fluxo de autorregularização.",
    statusInicial: "ocioso",
    itensProcessadosInicial: 1_607,
    filaInicial: 0,
    tempoMedioMsInicial: 720,
  },
  {
    id: "FA10",
    nome: "Agente de Relatórios",
    modulo: "5 · Monitoramento",
    descricao: "Atualiza painéis gerenciais e alerta sobre progresso das metas.",
    statusInicial: "ativo",
    itensProcessadosInicial: 512,
    filaInicial: 1,
    tempoMedioMsInicial: 1_890,
  },
  {
    id: "FA11",
    nome: "Copilot Fiscal",
    modulo: "7 · Suporte e Copilot",
    descricao: "Responde consultas do auditor em linguagem natural, fundamentado em fontes.",
    statusInicial: "ativo",
    itensProcessadosInicial: 3_398,
    filaInicial: 8,
    tempoMedioMsInicial: 1_120,
  },
];

function generateId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `evt-${Math.random().toString(36).slice(2)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createSeedEvent(agent: AgentBlueprint): ExecutionEvent {
  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    tipo: "info",
    mensagem: "Agente inicializado.",
    itensProcessados: 0,
    duracaoMs: agent.tempoMedioMsInicial,
  };
}

function pushEvent(agent: PipelineAgent, evento: ExecutionEvent): ExecutionEvent[] {
  const MAX_EVENTS = 20;
  return [evento, ...agent.eventos].slice(0, MAX_EVENTS);
}

export function getInitialAgents(): PipelineAgent[] {
  return AGENT_BLUEPRINTS.map((blueprint) => ({
    id: blueprint.id,
    nome: blueprint.nome,
    modulo: blueprint.modulo,
    descricao: blueprint.descricao,
    status: blueprint.statusInicial,
    ultimaExecucao: new Date().toISOString(),
    itensProcessados: blueprint.itensProcessadosInicial,
    fila: blueprint.filaInicial,
    tempoMedioMs: blueprint.tempoMedioMsInicial,
    eventos: [createSeedEvent(blueprint)],
  }));
}

/**
 * Avança a simulação um "tick": cada agente tem chance de mudar de estado
 * (ativo processa fila, ocioso pode acordar, erro pode se recuperar ou
 * persistir). Função pura — não lê nem escreve estado global — para ficar
 * fácil de testar e para o chamador decidir onde guardar o snapshot.
 */
export function tickAgents(agents: PipelineAgent[]): AgentsTickResult {
  const novosErros: AgentErrorAlert[] = [];
  const now = new Date().toISOString();

  const nextAgents = agents.map((agent): PipelineAgent => {
    if (agent.status === "erro") {
      if (chance(0.3)) {
        const evento: ExecutionEvent = {
          id: generateId(),
          timestamp: now,
          tipo: "sucesso",
          mensagem: "Agente recuperado após reinício automático.",
          itensProcessados: 0,
          duracaoMs: agent.tempoMedioMs,
        };
        return {
          ...agent,
          status: "ocioso",
          ultimaExecucao: now,
          eventos: pushEvent(agent, evento),
        };
      }
      return agent;
    }

    if (agent.status === "ocioso") {
      if (chance(0.35)) {
        const evento: ExecutionEvent = {
          id: generateId(),
          timestamp: now,
          tipo: "info",
          mensagem: "Novo lote disponível — iniciando processamento.",
          itensProcessados: 0,
          duracaoMs: 0,
        };
        return {
          ...agent,
          status: "ativo",
          fila: agent.fila + randomInt(1, 12),
          eventos: pushEvent(agent, evento),
        };
      }
      return { ...agent, fila: agent.fila + (chance(0.4) ? randomInt(0, 3) : 0) };
    }

    // agent.status === "ativo"
    if (chance(0.06)) {
      const mensagem = "Falha ao processar lote — divergência inesperada nos dados de origem.";
      novosErros.push({ agentId: agent.id, agentNome: agent.nome, mensagem, timestamp: now });
      const evento: ExecutionEvent = {
        id: generateId(),
        timestamp: now,
        tipo: "erro",
        mensagem,
        itensProcessados: 0,
        duracaoMs: agent.tempoMedioMs,
      };
      return { ...agent, status: "erro", ultimaExecucao: now, eventos: pushEvent(agent, evento) };
    }

    const processados = randomInt(4, 40);
    const filaRestante = Math.max(0, agent.fila - randomInt(2, 18) + randomInt(0, 8));
    const tempoMedioMs = clamp(agent.tempoMedioMs + randomInt(-60, 60), 150, 6_000);
    const evento: ExecutionEvent = {
      id: generateId(),
      timestamp: now,
      tipo: "sucesso",
      mensagem: `Processou ${processados} itens em ${tempoMedioMs} ms.`,
      itensProcessados: processados,
      duracaoMs: tempoMedioMs,
    };
    const finalizouFila = filaRestante === 0 && chance(0.4);

    return {
      ...agent,
      status: finalizouFila ? "ocioso" : "ativo",
      ultimaExecucao: now,
      itensProcessados: agent.itensProcessados + processados,
      fila: filaRestante,
      tempoMedioMs,
      eventos: pushEvent(agent, evento),
    };
  });

  return { agents: nextAgents, novosErros };
}
