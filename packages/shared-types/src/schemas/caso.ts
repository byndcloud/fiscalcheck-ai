import { z } from "zod";

/*
  Caso fiscal (módulo 4 — Gestão da Fiscalização).
  Toda transição de status deveria disparar um `AuditableAction`, mas o
  MSW não simula o log de auditoria — só devolve o estado agregado.
*/

export const StatusCasoSchema = z.enum([
  "aberto",
  "em_analise",
  "aguardando_contribuinte",
  "autorregularizado",
  "encerrado",
  "arquivado",
]);
export type StatusCaso = z.infer<typeof StatusCasoSchema>;

export const CasoSchema = z.object({
  id: z.string(),
  contribuinteId: z.string(),
  status: StatusCasoSchema,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  atribuidoA: z.string().optional(),
  prazoLimite: z.string().optional(),
  scoreValor: z.number().min(0).max(100).optional(),
  divergenciaIds: z.array(z.string()).default([]),
  proximaAcaoRecomendada: z.string().optional(),
  observacoes: z.string().optional(),
});
export type Caso = z.infer<typeof CasoSchema>;
