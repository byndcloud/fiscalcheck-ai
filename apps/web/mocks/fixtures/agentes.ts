import type { Agente } from "@fiscalcheck/shared-types";

export const agentesFixture: Agente[] = [
  {
    id: "ag-ingestao",
    nome: "Agente de Ingestão",
    tipo: "ingestao",
    status: "ativo",
    ultimaExecucao: "2026-07-02T13:00:00Z",
    proximaExecucao: "2026-07-02T15:00:00Z",
    totalExecucoes: 128,
    descricao: "Consome NFS-e, DIMP e PGDAS. Aplica quarentena para arquivos com esquema inválido.",
  },
  {
    id: "ag-gatekeeper",
    nome: "Gatekeeper de Qualidade",
    tipo: "gatekeeper",
    status: "ativo",
    ultimaExecucao: "2026-07-02T13:03:00Z",
    totalExecucoes: 128,
    descricao: "Valida integridade e completude do lote antes de liberar para cruzamento.",
  },
  {
    id: "ag-scoring",
    nome: "Motor de Score",
    tipo: "scoring",
    status: "ativo",
    ultimaExecucao: "2026-07-02T06:30:00Z",
    proximaExecucao: "2026-07-03T06:30:00Z",
    totalExecucoes: 96,
    descricao: "Recomputa o score de risco diariamente às 06:30 (America/Sao_Paulo).",
  },
  {
    id: "ag-orquestrador",
    nome: "Orquestrador de Fiscalização",
    tipo: "orquestrador",
    status: "pausado",
    ultimaExecucao: "2026-07-01T22:00:00Z",
    totalExecucoes: 34,
    descricao:
      "Sugere próxima ação por caso — pausado por segurança até revisão de novos gatilhos.",
  },
  {
    id: "ag-copilot",
    nome: "Copilot Fiscal (RAG)",
    tipo: "copilot",
    status: "inicializando",
    totalExecucoes: 0,
    descricao: "Assistente do auditor — em fase de aquecimento do índice vetorial de precedentes.",
  },
];
