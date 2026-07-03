import { z } from "zod";

/*
  Papéis do sistema (AGENTS.md §1.3). Valores em pt-BR para casar com o
  backend (o backend usa `cidadao` e `agente_sistema` no enum). Labels
  humanos ficam na camada de UI (apps/web/lib/roles.ts).
*/
export const RoleSchema = z.enum(["auditor", "supervisor", "admin", "cidadao", "agente_sistema"]);

export type Role = z.infer<typeof RoleSchema>;
