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

export const NotificacaoSchema = z.object({
  id: z.string(),
  tipo: TipoNotificacaoSchema,
  titulo: z.string(),
  corpo: z.string(),
  casoId: z.string().optional(),
  contribuinteId: z.string().optional(),
  severidade: z.number().int().min(1).max(5),
  criadoEm: z.string(),
  lida: z.boolean().default(false),
  lidaEm: z.string().optional(),
});
export type Notificacao = z.infer<typeof NotificacaoSchema>;
