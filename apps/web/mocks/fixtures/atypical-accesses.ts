import type { AtypicalAccess } from "@fiscalcheck/shared-types";

/*
  Painel do Agente de Conformidade (T19 · módulo 6).

  Subconjunto dos eventos ATÍPICOS que exige decisão do Admin — cada
  registro aponta para o `entryId` original da trilha completa. O
  agente já pré-classifica a severidade; o Admin bloqueia ou libera.
  Bloqueio no mock é apenas um flag (`blocked = true`) — o ator não
  perde acesso de fato, mas o evento fica registrado.
*/

export const atypicalAccessesFixture: AtypicalAccess[] = [
  {
    id: "atp-2026-000003",
    entryId: "aud-2026-000033",
    detectedAt: "2026-07-03T02:41:07Z",
    actorId: "mock-auditor",
    actorName: "Julia Ferraz",
    actorRole: "auditor",
    ipAddress: "200.19.42.88",
    resource: "cases:bulk",
    reason: "Tentativa de export em massa fora do papel do auditor (bloqueada pelo RBAC).",
    severity: "alta",
    blocked: false,
  },
  {
    id: "atp-2026-000002",
    entryId: "aud-2026-000034",
    detectedAt: "2026-07-03T02:58:41Z",
    actorId: "mock-auditor",
    actorName: "Julia Ferraz",
    actorRole: "auditor",
    ipAddress: "200.19.42.88",
    resource: "contribuinte:ct-005",
    reason: "Consulta a contribuinte fora da carteira habitual do auditor.",
    severity: "media",
    blocked: false,
  },
  {
    id: "atp-2026-000001",
    entryId: "aud-2026-000035",
    detectedAt: "2026-07-03T03:14:19Z",
    actorId: "mock-auditor",
    actorName: "Julia Ferraz",
    actorRole: "auditor",
    ipAddress: "200.19.42.88",
    resource: "sessao:web",
    reason:
      "Acesso fora do horário de expediente (03h14) a partir de IP fora da faixa institucional.",
    severity: "alta",
    blocked: false,
  },
  {
    id: "atp-2026-000000",
    entryId: "aud-2026-000027",
    detectedAt: "2026-07-02T08:41:03Z",
    actorId: "unknown",
    actorName: "Tentativa desconhecida",
    actorRole: "agente_sistema",
    ipAddress: "45.183.201.7",
    resource: "sessao:web",
    reason: "5 tentativas de login com senha inválida em sequência — possível brute-force.",
    severity: "baixa",
    blocked: true,
    blockedBy: "Rafael Neves (Administrador)",
    blockedAt: "2026-07-02T08:44:12Z",
  },
];
