import type { RiskModelChange, RiskModelConfig } from "@fiscalcheck/shared-types";

/*
  Configuração vigente do Modelo de Risco (T02 · módulo 3).
  Os pesos por CATEGORIA (cruzamento, grafo, cadastro, histórico) casam com
  o campo `FatorRisco.origem` dos scores da fixture — assim a simulação
  do preview altera os cinco casos existentes de forma coerente com o
  cálculo real do backend futuro.
*/

export const riskModelConfigFixture: RiskModelConfig = {
  version: "v2.4",
  updatedAt: "2026-06-28T14:12:00Z",
  updatedBy: "Ana Beltrão",
  updatedByRole: "supervisor",
  weights: {
    cruzamento: 0.4,
    grafo: 0.25,
    cadastro: 0.15,
    historico: 0.2,
  },
  bands: {
    baixo: 20,
    medio: 45,
    alto: 70,
    critico: 85,
  },
  rules: [
    {
      id: "rule-cruzamento",
      label: "Cruzamento declarado × NFS-e",
      description:
        "Considera divergências entre PGDAS/DIMP/DEFIS e o total de NFS-e emitidas por competência.",
      category: "cruzamento",
      enabled: true,
    },
    {
      id: "rule-grafo",
      label: "Rede societária e endereço",
      description:
        "Considera vínculos societários, coincidência de endereço e comunidade detectada por graph analytics.",
      category: "grafo",
      enabled: true,
    },
    {
      id: "rule-cadastro",
      label: "Consistência cadastral e regime",
      description:
        "Considera enquadramento tributário, teto do Simples, CNAE declarado e situação cadastral.",
      category: "cadastro",
      enabled: true,
    },
    {
      id: "rule-historico",
      label: "Histórico de autuações e regularidade",
      description:
        "Considera autuações mantidas em recurso nos últimos 24 meses, sazonalidade típica do setor e regularidade histórica.",
      category: "historico",
      enabled: true,
    },
  ],
};

/*
  Histórico append-only. Ordenado por timestamp DESC pela UI —
  aqui vem em ordem cronológica direta para deixar clara a evolução.
*/
export const riskModelHistoryFixture: RiskModelChange[] = [
  {
    id: "rmc-2026-000001",
    timestamp: "2026-04-11T09:20:00Z",
    actorId: "mock-admin",
    actorName: "Rafael Neves",
    actorRole: "admin",
    correlationId: "cor-rm-a12b3c",
    fromVersion: "v2.2",
    toVersion: "v2.3",
    summary:
      "Recalibragem trimestral: peso do histórico ↑ (0,15 → 0,20) após revisão do painel gerencial.",
    fieldsChanged: ["weights.historico"],
  },
  {
    id: "rmc-2026-000002",
    timestamp: "2026-05-22T16:47:00Z",
    actorId: "mock-supervisor",
    actorName: "Ana Beltrão",
    actorRole: "supervisor",
    correlationId: "cor-rm-d4e5f6",
    fromVersion: "v2.3",
    toVersion: "v2.3.1",
    summary: "Faixa 'alto' ampliada (65 → 70) para reduzir falsos positivos no setor têxtil.",
    fieldsChanged: ["bands.alto"],
  },
  {
    id: "rmc-2026-000003",
    timestamp: "2026-06-28T14:12:00Z",
    actorId: "mock-supervisor",
    actorName: "Ana Beltrão",
    actorRole: "supervisor",
    correlationId: "cor-rm-g7h8i9",
    fromVersion: "v2.3.1",
    toVersion: "v2.4",
    summary:
      "Peso do cruzamento ↑ (0,35 → 0,40) e do grafo ↑ (0,20 → 0,25); regra de cadastro permanece ativa.",
    fieldsChanged: ["weights.cruzamento", "weights.grafo"],
  },
];
