import { z } from "zod";

/*
  Monitoramento Contínuo CTC (T07 · módulo 2 · RF09/FA10).
  Feed em quase tempo real: cada lote de NFS-e recebido passa por regras
  e scoring incremental. Quando uma regra dispara, o alerta é ANTECIPADO
  (antes do ciclo mensal de cruzamento) e o convite à autorregularização
  pode ser sugerido pelo auditor — nunca disparado automaticamente
  (AGENTS.md §1.1 — human-in-the-loop).
*/

export const CtcAlertSchema = z.object({
  id: z.string().min(1),
  /** Regra de monitoramento que disparou (aceite T07). */
  regra: z.string().min(1),
  descricao: z.string().min(1),
  contribuinteId: z.string().min(1),
  contribuinteNome: z.string().min(1),
  /** Janela "fato gerador → detecção", em minutos (aceite T07). */
  janelaMinutos: z.number().int().nonnegative(),
  scoreIncremental: z.number().min(0).max(100),
  /** True após o auditor sugerir o convite à autorregularização. */
  sugestaoEnviada: z.boolean(),
  /** Caso candidato aberto a partir da sugestão. */
  casoId: z.string().optional(),
});
export type CtcAlert = z.infer<typeof CtcAlertSchema>;

export const CtcBatchSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().positive(),
  recebidoEm: z.string(),
  notas: z.number().int().positive(),
  valorTotal: z.number().nonnegative(),
  regrasAvaliadas: z.number().int().positive(),
  processamentoSegundos: z.number().nonnegative(),
  alerta: CtcAlertSchema.optional(),
});
export type CtcBatch = z.infer<typeof CtcBatchSchema>;

export const CtcFeedSchema = z.object({
  atualizadoEm: z.string(),
  /** Janela média fato gerador → detecção na janela corrente (minutos). */
  janelaMediaMinutos: z.number().nonnegative(),
  totalNotas: z.number().int().nonnegative(),
  totalAlertas: z.number().int().nonnegative(),
  /** Lotes mais recentes primeiro. */
  lotes: z.array(CtcBatchSchema),
});
export type CtcFeed = z.infer<typeof CtcFeedSchema>;
