import { z } from "zod";

import { NivelRiscoSchema } from "./score";

/*
  Contratos do módulo 5 (Analytics / Monitoramento) usados no Painel
  Gerencial: big numbers (mês a mês), série mensal de recuperação,
  distribuição por nível de risco e alertas inteligentes emitidos pela
  esteira de agentes.

  Todos os valores monetários são em BRL com precisão de real inteiro
  (`.nonnegative()` para blindar contra sinais invertidos vindos do ETL).
*/

const CompetenciaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/u, "Competência deve seguir o formato AAAA-MM.");
export const KpiMoMSchema = z.object({
  label: z.string(),
  valorBrl: z.number().nonnegative().optional(),
  valorNumerico: z.number().nonnegative().optional(),
  competencia: CompetenciaSchema,
  competenciaAnterior: CompetenciaSchema,
  variacaoAbsoluta: z.number(),
  variacaoPercentual: z.number(),
  sub: z.string().optional(),
});
export type KpiMoM = z.infer<typeof KpiMoMSchema>;

export const PanelKpisSchema = z.object({
  recuperado: KpiMoMSchema,
  casosAbertos: KpiMoMSchema,
  potencialRecuperavel: KpiMoMSchema,
  atualizadoEm: z.string(),
});
export type PanelKpis = z.infer<typeof PanelKpisSchema>;

export const MonthlyRecoveryPointSchema = z.object({
  competencia: CompetenciaSchema,
  label: z.string().min(1),
  recuperadoBrl: z.number().nonnegative(),
  potencialBrl: z.number().nonnegative(),
});
export type MonthlyRecoveryPoint = z.infer<typeof MonthlyRecoveryPointSchema>;

export const MonthlyRecoverySeriesSchema = z.object({
  moeda: z.literal("BRL"),
  unidade: z.enum(["reais", "milhares", "milhoes"]),
  pontos: z.array(MonthlyRecoveryPointSchema).min(1),
});
export type MonthlyRecoverySeries = z.infer<typeof MonthlyRecoverySeriesSchema>;

export const RiskDistributionEntrySchema = z.object({
  nivel: NivelRiscoSchema,
  label: z.string().min(1),
  contagem: z.number().int().nonnegative(),
  percentual: z.number().min(0).max(100),
});
export type RiskDistributionEntry = z.infer<typeof RiskDistributionEntrySchema>;

export const RiskDistributionSchema = z.object({
  totalPontuados: z.number().int().nonnegative(),
  entradas: z.array(RiskDistributionEntrySchema).min(1),
});
export type RiskDistribution = z.infer<typeof RiskDistributionSchema>;

export const SmartAlertKindSchema = z.enum(["critico", "rede", "meta", "info"]);
export type SmartAlertKind = z.infer<typeof SmartAlertKindSchema>;

export const SmartAlertSchema = z.object({
  id: z.string().min(1),
  tipo: SmartAlertKindSchema,
  tag: z.string().min(1),
  mensagem: z.string().min(1),
  emitidoEm: z.string(),
  relativoAtual: z.string().optional(),
  linkHref: z.string().optional(),
});
export type SmartAlert = z.infer<typeof SmartAlertSchema>;
