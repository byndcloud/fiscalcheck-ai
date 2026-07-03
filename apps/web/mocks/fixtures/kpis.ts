import { z } from "zod";

/*
  KPIs do módulo 5 (Analytics/Monitoramento). Inline aqui até virar
  contrato estável promovido para packages/shared-types.
*/
export const KPIsAnalyticsSchema = z.object({
  casosAbertos: z.number().int().nonnegative(),
  casosEmAnalise: z.number().int().nonnegative(),
  valorRecuperavelBrl: z.number().nonnegative(),
  divergenciasCriticas: z.number().int().nonnegative(),
  metasEmRisco: z.number().int().nonnegative(),
  scoreMedio: z.number().min(0).max(100),
  taxaAutorregularizacao: z.number().min(0).max(1),
  atualizadoEm: z.string(),
});
export type KPIsAnalytics = z.infer<typeof KPIsAnalyticsSchema>;

export const kpisFixture: KPIsAnalytics = {
  casosAbertos: 42,
  casosEmAnalise: 27,
  valorRecuperavelBrl: 3_284_500.5,
  divergenciasCriticas: 8,
  metasEmRisco: 2,
  scoreMedio: 57.4,
  taxaAutorregularizacao: 0.62,
  atualizadoEm: "2026-07-02T14:00:00Z",
};
