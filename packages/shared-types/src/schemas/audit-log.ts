import { z } from "zod";

import { RoleSchema } from "./role";

/*
  Trilha de auditoria (T19 · módulo 6 — Governança e Conformidade).

  `AuditLogEntry` é a visão rica exposta ao Admin na tela de trilha —
  ela ESTENDE o `AuditableAction` (contrato low-level, append-only) sem
  substituí-lo: o append no backend continua usando o contrato mínimo,
  mas o read do painel devolve os campos adicionais que a UI precisa
  para exibir ator legível, IP, resultado e marcação de atipicidade.

  Todo campo aqui é considerado sob sigilo fiscal (art. 198 CTN + LGPD);
  a UI deve mascarar `dadosAcessados` por padrão e registrar qualquer
  "revelar" como novo evento na própria trilha (append-only real).
*/

export const AuditLogResultSchema = z.enum(["sucesso", "negado", "erro"]);
export type AuditLogResult = z.infer<typeof AuditLogResultSchema>;

/*
  IPv4 sintético — o mock não usa IPv6 no MVP. Regex mantém o formato
  legível para a UI e para o filtro por prefixo; validação real fica
  no backend quando este substituir o MSW.
*/
const Ipv4Schema = z
  .string()
  .regex(/^(?:\d{1,3}\.){3}\d{1,3}$/u, "IP inválido — esperado formato IPv4.");

export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  action: z.string().min(1),
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  actorRole: RoleSchema,
  ipAddress: Ipv4Schema,
  resource: z.string().min(1),
  result: AuditLogResultSchema,
  atypical: z.boolean(),
  atypicalReason: z.string().optional(),
  correlationId: z.string().min(1),
  details: z.string().min(1),
  /*
    Dado sensível — nome, CNPJ, CPF, valores. Máscara aplicada por
    padrão na UI (`data-sensitive` + `masks.ts`); revelação registra
    evento próprio na trilha.
  */
  dadosAcessados: z.string().optional(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/*
  Visão específica do Agente de Conformidade: um subconjunto dos
  eventos atípicos que exige decisão explícita do Admin. Carrega o
  ID do evento original (`entryId`) para o drill-in referenciar a
  trilha e o flag `blocked` que congela o ator no mock após o
  clique em "Bloquear".
*/
export const AtypicalAccessSchema = z.object({
  id: z.string().min(1),
  entryId: z.string().min(1),
  detectedAt: z.string(),
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  actorRole: RoleSchema,
  ipAddress: Ipv4Schema,
  resource: z.string().min(1),
  reason: z.string().min(1),
  severity: z.enum(["baixa", "media", "alta"]),
  blocked: z.boolean(),
  blockedBy: z.string().optional(),
  blockedAt: z.string().optional(),
});
export type AtypicalAccess = z.infer<typeof AtypicalAccessSchema>;

/*
  Payload de request para bloquear um acesso atípico. `justificativa`
  é obrigatória e será concatenada ao `details` do evento gerado.
*/
export const BlockAtypicalRequestSchema = z.object({
  justificativa: z.string().min(10, "Justificativa mínima de 10 caracteres."),
});
export type BlockAtypicalRequest = z.infer<typeof BlockAtypicalRequestSchema>;
