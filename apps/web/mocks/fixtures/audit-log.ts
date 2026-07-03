import type { AuditableAction } from "@fiscalcheck/shared-types";

/*
  Log de auditoria sintético (módulo 6 — append-only na realidade).
  Aqui é read-only para o painel de Governança.
*/
export const auditLogFixture: AuditableAction[] = [
  {
    action: "caso.criado",
    actor_id: "mock-auditor",
    correlation_id: "cor-a1b2c3",
    timestamp: "2026-07-01T10:00:00Z",
  },
  {
    action: "caso.transicao_status",
    actor_id: "mock-auditor",
    correlation_id: "cor-a1b2c3",
    timestamp: "2026-07-01T10:14:22Z",
  },
  {
    action: "score.recomputado",
    actor_id: "mock-agente_sistema",
    correlation_id: "cor-d4e5f6",
    timestamp: "2026-07-02T06:30:00Z",
  },
  {
    action: "notificacao.enviada",
    actor_id: "mock-agente_sistema",
    correlation_id: "cor-g7h8i9",
    timestamp: "2026-07-02T09:00:00Z",
  },
  {
    action: "usuario.login",
    actor_id: "mock-supervisor",
    correlation_id: "cor-j0k1l2",
    timestamp: "2026-07-02T13:22:00Z",
  },
];
