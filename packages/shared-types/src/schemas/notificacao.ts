import { z } from "zod";

/*
  Notificação in-app do auditor. O plano de T01 marca como "lida" apenas
  em memória via optimistic update do TanStack Query (sem localStorage).
*/

export const TipoNotificacaoSchema = z.enum([
  "caso_alto_risco",
  "prazo",
  "devolutiva",
  "meta_risco",
]);
export type TipoNotificacao = z.infer<typeof TipoNotificacaoSchema>;

/*
  Diferencia notificações emitidas automaticamente pela esteira de
  agentes (T17 · FA06 — Agente de Relatórios) das criadas por ação
  humana. A UI pode usar `origem` para marcar visualmente a
  procedência (microtag `AGENTE` no sino) sem depender do `tipo`.
*/
export const NotificacaoOrigemSchema = z.enum(["manual", "auto_kpi", "auto_meta"]);
export type NotificacaoOrigem = z.infer<typeof NotificacaoOrigemSchema>;

export const NotificacaoSchema = z.object({
  id: z.string(),
  tipo: TipoNotificacaoSchema,
  titulo: z.string(),
  corpo: z.string(),
  casoId: z.string().optional(),
  contribuinteId: z.string().optional(),
  metaId: z.string().optional(),
  severidade: z.number().int().min(1).max(5),
  criadoEm: z.string(),
  lida: z.boolean().default(false),
  lidaEm: z.string().optional(),
  origem: NotificacaoOrigemSchema.default("manual"),
  linkHref: z.string().optional(),
});
export type Notificacao = z.infer<typeof NotificacaoSchema>;
