import { z } from "zod";

/*
  Score de risco fiscal (módulo 3 — IA Preditiva).
  Cada score explicita:
   - `fatores` que compuseram a pontuação (XAI mínimo);
   - `modeloVersao` para permitir rollback e reproduzibilidade;
   - `proximaAcaoRecomendada` (o auditor sempre decide — AGENTS.md §1.1).
*/

export const NivelRiscoSchema = z.enum(["conforme", "baixo", "medio", "alto", "critico"]);
export type NivelRisco = z.infer<typeof NivelRiscoSchema>;

export const FatorRiscoSchema = z.object({
  nome: z.string(),
  peso: z.number().min(0).max(1),
  contribuicao: z.number(),
  evidencia: z.string(),
  origem: z.enum(["cruzamento", "grafo", "cadastro", "historico"]),
});
export type FatorRisco = z.infer<typeof FatorRiscoSchema>;

export const ScoreSchema = z.object({
  contribuinteId: z.string(),
  valor: z.number().min(0).max(100),
  nivel: NivelRiscoSchema,
  calculadoEm: z.string(),
  modeloVersao: z.string(),
  fatores: z.array(FatorRiscoSchema).min(1),
  proximaAcaoRecomendada: z.string().optional(),
});
export type Score = z.infer<typeof ScoreSchema>;
