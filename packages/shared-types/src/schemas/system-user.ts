import { z } from "zod";

import { RoleSchema } from "./role";

/*
  Gestão de usuários e papéis (T19 · módulo 6).

  Este é o cadastro OPERACIONAL da plataforma — servidores da Fazenda
  autorizados a acessar o sistema. Não confundir com `Contribuinte`
  (módulo 1), que é o cadastro fiscal externo.

  Regra dura (AGENTS.md §1.1): usuários NUNCA são deletados. O
  `status = inativo` é a única forma de desabilitar sem perder a
  cadeia de custódia sobre ações passadas do ator.
*/

export const SystemUserStatusSchema = z.enum(["ativo", "suspenso", "inativo"]);
export type SystemUserStatus = z.infer<typeof SystemUserStatusSchema>;

/*
  Matrícula funcional — string livre no MVP; validação estrita do
  formato oficial da Prefeitura de Brusque será feita quando a
  integração real com o RH substituir o mock.
*/
const MatriculaSchema = z.string().trim().min(3, "Matrícula muito curta.");

export const SystemUserSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(2),
  email: z.string().email(),
  matricula: MatriculaSchema,
  role: RoleSchema,
  status: SystemUserStatusSchema,
  mfaHabilitado: z.boolean(),
  criadoEm: z.string(),
  ultimoAcesso: z.string().optional(),
  observacoes: z.string().optional(),
});
export type SystemUser = z.infer<typeof SystemUserSchema>;

/*
  MFA obrigatório para papéis internos (auditor/supervisor/admin) por
  contrato de segurança do edital. `cidadao` e `agente_sistema` não
  passam por MFA humano — o backend real vai recusar essas
  combinações; aqui replicamos como refine para a UI travar cedo.
*/
export const UserCreateRequestSchema = z
  .object({
    nome: z.string().trim().min(2),
    email: z.string().email(),
    matricula: MatriculaSchema,
    role: RoleSchema,
    mfaHabilitado: z.boolean(),
    observacoes: z.string().trim().max(280).optional(),
  })
  .refine((data) => !["auditor", "supervisor", "admin"].includes(data.role) || data.mfaHabilitado, {
    message: "Papéis internos exigem MFA habilitado (AGENTS.md §1.3).",
    path: ["mfaHabilitado"],
  });
export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;

export const UserUpdateRequestSchema = z
  .object({
    nome: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    matricula: MatriculaSchema.optional(),
    role: RoleSchema.optional(),
    status: SystemUserStatusSchema.optional(),
    mfaHabilitado: z.boolean().optional(),
    observacoes: z.string().trim().max(280).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Envie ao menos um campo para atualizar.",
  });
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
