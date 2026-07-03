import type { Role } from "@fiscalcheck/shared-types";

/*
  Labels e utilitários de papel (mapping pt-BR + rota de destino após login).
*/

export const ROLE_LABEL_PT: Record<Role, string> = {
  auditor: "Auditor fiscal",
  supervisor: "Gestor / Supervisor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};

const ROLE_SHORT_PT: Record<Role, string> = {
  auditor: "Auditor",
  supervisor: "Gestor",
  admin: "Admin",
  cidadao: "Cidadão",
  agente_sistema: "Sistema",
};

export function roleShortLabel(role: Role): string {
  return ROLE_SHORT_PT[role];
}

/**
 * Rota-destino após login por papel.
 * Cidadão vai direto ao portal; demais vão pro dashboard interno.
 */
export function homeRouteForRole(role: Role): "/citizen" | "/dashboard" {
  return role === "cidadao" ? "/citizen" : "/dashboard";
}

/**
 * Papéis autorizados a acessar rotas de auditor (`/(dashboard)/*` exceto `/citizen`).
 */
export const AUDITOR_ROLES: readonly Role[] = ["auditor", "supervisor", "admin"] as const;

export function isAuditorRole(role: Role | null | undefined): boolean {
  return !!role && (AUDITOR_ROLES as readonly Role[]).includes(role);
}
