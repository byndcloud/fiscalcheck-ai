/**
 * Tipos TS compartilhados entre apps/web e apps/api.
 *
 * Fase MVP: a geração via OpenAPI ainda NÃO está ativa — os tipos abaixo
 * são mantidos à mão e são a fonte da verdade temporária.
 *
 * Quando a API tiver endpoints reais, ative a geração:
 *   pnpm --filter @fiscalcheck/shared-types generate
 * e reexporte aqui (`export type { paths, components } from "./openapi"`).
 * A partir daí, o `openapi.d.ts` gerado não deve ser editado à mão.
 */

export type AuditableAction = {
  action: string;
  actor_id: string;
  correlation_id: string;
  timestamp: string;
};

export type Role = "auditor" | "supervisor" | "admin" | "cidadao" | "agente_sistema";
