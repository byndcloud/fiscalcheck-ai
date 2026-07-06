import { z } from "zod";

import { DecisionActionSchema } from "./case-decision";
import { TipoDivergenciaSchema } from "./divergencia";

/*
  Ambiente de Simulação e Capacitação (T20 · RSC04 · módulo 6).

  Casos-exercício para novos auditores, totalmente separados do
  ambiente "real": contribuintes anonimizados por codinome (Alfa,
  Bravo, …) com CNPJ mascarado, e um gabarito baseado na decisão
  histórica de um caso verídico pseudonimizado.

  Regra de sigilo: o gabarito NUNCA viaja no GET da biblioteca — só é
  revelado pelo POST da tentativa, para o exercício ter valor didático.
*/

export const TrainingDifficultySchema = z.enum(["iniciante", "intermediario", "avancado"]);
export type TrainingDifficulty = z.infer<typeof TrainingDifficultySchema>;

/* Contribuinte fictício do exercício — sempre anonimizado. */
export const TrainingTaxpayerSchema = z.object({
  codinome: z.string().min(1),
  cnpjMascarado: z.string().min(1),
  atividade: z.string().min(1),
  regime: z.string().min(1),
});
export type TrainingTaxpayer = z.infer<typeof TrainingTaxpayerSchema>;

export const TrainingDivergenciaSchema = z.object({
  tipo: TipoDivergenciaSchema,
  resumo: z.string().min(1),
  valorDeclarado: z.number().nonnegative(),
  valorApurado: z.number().nonnegative(),
  competencia: z.string().min(1),
});
export type TrainingDivergencia = z.infer<typeof TrainingDivergenciaSchema>;

/*
  Resultado de uma tentativa — devolvido pelo POST e reapresentado no
  GET quando o exercício já foi concluído pelo auditor em formação.
*/
export const TrainingGabaritoSchema = z.object({
  acao: DecisionActionSchema,
  justificativa: z.string().min(1),
  resultado: z.string().min(1),
});
export type TrainingGabarito = z.infer<typeof TrainingGabaritoSchema>;

export const TrainingAttemptResultSchema = z.object({
  casoId: z.string().min(1),
  acertou: z.boolean(),
  suaDecisao: z.object({
    acao: DecisionActionSchema,
    justificativa: z.string().min(1),
  }),
  gabarito: TrainingGabaritoSchema,
  aprendizado: z.string().min(1),
  tentadoEm: z.string(),
});
export type TrainingAttemptResult = z.infer<typeof TrainingAttemptResultSchema>;

export const TrainingCaseSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  dificuldade: TrainingDifficultySchema,
  contribuinte: TrainingTaxpayerSchema,
  contexto: z.string().min(1),
  divergencia: TrainingDivergenciaSchema,
  scoreValor: z.number().min(0).max(100),
  fatoresResumo: z.array(z.string().min(1)).min(1),
  recomendacaoAgente: z.string().min(1),
  /** Presente apenas quando o auditor já concluiu o exercício. */
  tentativa: TrainingAttemptResultSchema.optional(),
});
export type TrainingCase = z.infer<typeof TrainingCaseSchema>;

export const TrainingAttemptRequestSchema = z.object({
  acao: DecisionActionSchema,
  justificativa: z
    .string()
    .trim()
    .min(20, "Justifique sua decisão com pelo menos 20 caracteres — faz parte do exercício."),
});
export type TrainingAttemptRequest = z.infer<typeof TrainingAttemptRequestSchema>;
