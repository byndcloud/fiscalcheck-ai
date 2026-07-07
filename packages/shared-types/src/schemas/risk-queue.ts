import { z } from "zod";

import { StatusCasoSchema } from "./caso";
import { RegimeTributarioSchema, SituacaoCadastralSchema } from "./contribuinte";
import { TipoDivergenciaSchema } from "./divergencia";
import { NivelRiscoSchema } from "./score";

/*
  Item da fila priorizada de contribuintes (T08 · módulo 3 · RF03/FA03).
  A fila é COMPOSTA pelo mock (score + cadastro + caso vinculado) para que
  o auditor veja tudo numa linha só — o front não precisa juntar 3 queries.
  `statusTratamento` distingue quem já está em tratamento (caso aberto)
  de quem ainda aguarda decisão humana (AGENTS.md §1.1).
*/

export const StatusTratamentoSchema = z.union([StatusCasoSchema, z.literal("sem_tratamento")]);
export type StatusTratamento = z.infer<typeof StatusTratamentoSchema>;

export const RiskQueueItemSchema = z.object({
  contribuinteId: z.string(),
  razaoSocial: z.string(),
  nomeFantasia: z.string().optional(),
  cnpjMascarado: z.string(),
  /** Atividade principal (código + descrição CNAE) — coluna "setor" da fila. */
  setor: z.string().optional(),
  regime: RegimeTributarioSchema,
  situacao: SituacaoCadastralSchema,
  scoreValor: z.number().min(0).max(100),
  nivel: NivelRiscoSchema,
  /** Estimativa sintética de valor recuperável (R$) — nunca dado real. */
  valorPotencial: z.number().min(0).optional(),
  statusTratamento: StatusTratamentoSchema,
  /** Caso mais recente vinculado, quando houver tratamento em curso. */
  casoId: z.string().optional(),
  /** Principal tipo de inconsistência detectado — eixo da segmentação. */
  tipoInconsistencia: TipoDivergenciaSchema.optional(),
  calculadoEm: z.string(),
  modeloVersao: z.string(),
});
export type RiskQueueItem = z.infer<typeof RiskQueueItemSchema>;
