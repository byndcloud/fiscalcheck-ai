import type { CaseDecision } from "@fiscalcheck/shared-types";

/*
  Cadeia decisória dos casos — append-only. O handler mock só empurra
  novas entradas via `unshift`; nenhuma edição/exclusão é permitida.

  Seed com histórico rico para o dossiê já abrir contando a evolução do
  caso. Cada `CaseDecision` também alimenta a UI da cadeia decisória
  (DecisionChainEntry).
*/
export const caseDecisionsFixture: CaseDecision[] = [
  // cs-2026-0142 · Nova Aurora — aguardando aprovação
  {
    id: "dec-2026-000058",
    casoId: "cs-2026-0142",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0058",
    timestamp: "2026-07-02T14:22:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "aguardando_aprovacao",
  },
  {
    id: "dec-2026-000057",
    casoId: "cs-2026-0142",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0057",
    timestamp: "2026-07-01T10:15:00Z",
    statusAnterior: "candidato",
    statusPosterior: "em_analise",
  },

  // cs-2026-0138 · Malharia Serra Bela — aguardando aprovação (2 revisões)
  {
    id: "dec-2026-000056",
    casoId: "cs-2026-0138",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0056",
    timestamp: "2026-07-02T09:45:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "aguardando_aprovacao",
  },
  {
    id: "dec-2026-000055",
    casoId: "cs-2026-0138",
    action: "ajustar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0055",
    timestamp: "2026-06-28T15:10:00Z",
    justificativa:
      "Ampliar o período de apuração para incluir 2024 — padrão sistemático merece escopo maior.",
    statusAnterior: "em_analise",
    statusPosterior: "em_analise",
  },
  {
    id: "dec-2026-000054",
    casoId: "cs-2026-0138",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0054",
    timestamp: "2026-06-24T11:30:00Z",
    statusAnterior: "candidato",
    statusPosterior: "em_analise",
  },

  // cs-2026-0135 · Drogaria Vida Nova — aguardando aprovação
  {
    id: "dec-2026-000053",
    casoId: "cs-2026-0135",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0053",
    timestamp: "2026-07-02T12:00:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "aguardando_aprovacao",
  },
  {
    id: "dec-2026-000052",
    casoId: "cs-2026-0135",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0052",
    timestamp: "2026-06-24T09:00:00Z",
    statusAnterior: "candidato",
    statusPosterior: "em_analise",
  },

  // cs-2026-0132 · Clínica Sorriso — aguardando aprovação
  {
    id: "dec-2026-000051",
    casoId: "cs-2026-0132",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0051",
    timestamp: "2026-07-01T18:30:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "aguardando_aprovacao",
  },

  // cs-2026-0128 · Vale Têxtil — notificado (com termo)
  {
    id: "dec-2026-000050",
    casoId: "cs-2026-0128",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0050",
    timestamp: "2026-06-30T18:14:00Z",
    statusAnterior: "aguardando_aprovacao",
    statusPosterior: "notificado",
    documentoGerado: "doc-2026-0001",
  },
  {
    id: "dec-2026-000049",
    casoId: "cs-2026-0128",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0049",
    timestamp: "2026-06-25T14:00:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "aguardando_aprovacao",
  },

  // cs-2026-0126 · Rio Branco Cargas — notificado (com termo)
  {
    id: "dec-2026-000048",
    casoId: "cs-2026-0126",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0048",
    timestamp: "2026-06-28T15:30:00Z",
    statusAnterior: "aguardando_aprovacao",
    statusPosterior: "notificado",
    documentoGerado: "doc-2026-0003",
  },

  // cs-2026-0117 · Ícaro TI — em autorregularização
  {
    id: "dec-2026-000047",
    casoId: "cs-2026-0117",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0047",
    timestamp: "2026-06-28T11:00:00Z",
    statusAnterior: "notificado",
    statusPosterior: "em_autorregularizacao",
  },

  // cs-2026-0104 · Coração Catarinense — fiscalização (com termo)
  {
    id: "dec-2026-000046",
    casoId: "cs-2026-0104",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0046",
    timestamp: "2026-06-15T09:00:00Z",
    statusAnterior: "aguardando_aprovacao",
    statusPosterior: "fiscalizacao",
    documentoGerado: "doc-2026-0002",
  },
  {
    id: "dec-2026-000045",
    casoId: "cs-2026-0104",
    action: "rejeitar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0045",
    timestamp: "2026-06-10T14:20:00Z",
    justificativa:
      "Autorregularização não é adequada — contribuinte não respondeu a duas notificações amigáveis.",
    statusAnterior: "notificado",
    statusPosterior: "fiscalizacao",
  },

  // cs-2026-0099 · Colinas do Vale — fiscalização (com termo)
  {
    id: "dec-2026-000044",
    casoId: "cs-2026-0099",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0044",
    timestamp: "2026-06-05T11:00:00Z",
    statusAnterior: "aguardando_aprovacao",
    statusPosterior: "fiscalizacao",
    documentoGerado: "doc-2026-0004",
  },

  // cs-2026-0087 · encerrado (contribuinte autorregularizou rapidamente)
  {
    id: "dec-2026-000043",
    casoId: "cs-2026-0087",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0043",
    timestamp: "2026-05-22T17:30:00Z",
    statusAnterior: "em_autorregularizacao",
    statusPosterior: "encerrado",
  },

  // cs-2026-0079 · encerrado
  {
    id: "dec-2026-000042",
    casoId: "cs-2026-0079",
    action: "aprovar",
    atorId: "mock-auditor",
    atorNome: "Rodrigo Miranda",
    atorPapel: "auditor",
    correlationId: "cid-hist-0042",
    timestamp: "2026-05-15T14:20:00Z",
    statusAnterior: "em_autorregularizacao",
    statusPosterior: "encerrado",
  },

  // cs-2026-0072 · encerrado (arquivado após esclarecimento)
  {
    id: "dec-2026-000041",
    casoId: "cs-2026-0072",
    action: "aprovar",
    atorId: "mock-supervisor",
    atorNome: "Ana Ferreira",
    atorPapel: "supervisor",
    correlationId: "cid-hist-0041",
    timestamp: "2026-05-18T14:10:00Z",
    statusAnterior: "em_analise",
    statusPosterior: "encerrado",
  },
];
