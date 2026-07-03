import type { Role } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Badge por papel (T19 · módulo 6).

  Ligeiramente diferente do StatusBadge fiscal — aqui a paleta é
  neutra (tokens `--n-*` e `--c-brand-050`), já que o papel é uma
  categoria administrativa, não um nível de risco.
*/

const ROLE_LABEL: Record<Role, string> = {
  auditor: "Auditor",
  supervisor: "Gestor",
  admin: "Administrador",
  cidadao: "Cidadão",
  agente_sistema: "Sistema",
};

const ROLE_STYLE: Record<Role, string> = {
  auditor:
    "bg-brand-050 text-brand-deep border-[color-mix(in_srgb,var(--c-brand)_18%,transparent)]",
  supervisor:
    "bg-[color-mix(in_srgb,var(--c-risk-3)_12%,var(--surface))] text-[color:var(--c-risk-3)] border-[color-mix(in_srgb,var(--c-risk-3)_35%,transparent)]",
  admin:
    "bg-[color-mix(in_srgb,var(--c-brand-deep)_10%,var(--surface))] text-[color:var(--c-brand-deep)] border-[color-mix(in_srgb,var(--c-brand-deep)_25%,transparent)]",
  cidadao: "bg-n-50 text-text-muted border-border",
  agente_sistema: "bg-n-100 text-text-muted border-border",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      data-slot="role-badge"
      data-role={role}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ROLE_STYLE[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
