/**
 * Tipos TS compartilhados entre apps/web e apps/api.
 *
 * O arquivo `openapi.d.ts` é gerado automaticamente do schema OpenAPI
 * exposto em `http://localhost:8000/openapi.json` — NÃO editar à mão.
 *
 * Para regenerar:
 *   pnpm --filter @fiscalcheck/shared-types generate
 *
 * Tipos manuais (não-OpenAPI) podem ficar abaixo neste arquivo, mas
 * a preferência é o backend ser a fonte da verdade.
 */

// export type { paths, components, operations } from "./openapi";

export type AuditableAction = {
	action: string;
	actor_id: string;
	correlation_id: string;
	timestamp: string;
};

export type Role =
	| "auditor"
	| "supervisor"
	| "admin"
	| "cidadao"
	| "agente_sistema";
