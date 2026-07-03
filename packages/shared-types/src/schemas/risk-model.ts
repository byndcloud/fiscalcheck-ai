import { z } from "zod";

import { RoleSchema } from "./role";

/*
  Configuração do Modelo de Risco (T02 · módulo 3 — IA Preditiva).

  A tela do FiscalCheck parametriza três eixos:

  1. `weights` — importância relativa (0..1) atribuída a cada CATEGORIA de
     fator de risco. Ao renormalizar, esses pesos são aplicados sobre as
     contribuições dos fatores (`FatorRisco.contribuicao`) com o mesmo
     `origem`. Ex.: aumentar `grafo` amplia a influência de vínculos
     societários e coincidência de endereço sobre o score final.

  2. `bands` — faixas de score (0..100) que definem os cinco níveis
     do espectro de risco (§3.3 do DS). Os limiares são cumulativos e
     estritamente crescentes: `baixo < medio < alto < critico`.

  3. `rules` — porteiros ON/OFF por categoria. Quando uma regra está
     desligada, TODOS os fatores da mesma origem são desconsiderados
     no cálculo (contribuição = 0). Permite ao Gestor suspender uma
     família de sinais sem apagar a configuração.

  Toda publicação é imutável e gera um `RiskModelChange` (append-only)
  — a lista atende ao critério de aceite "histórico de alterações de
  parâmetros (quem/quando)" e alimenta o log de auditoria do módulo 6.
*/

export const RiskFactorOriginSchema = z.enum(["cruzamento", "grafo", "cadastro", "historico"]);
export type RiskFactorOrigin = z.infer<typeof RiskFactorOriginSchema>;

export const RiskModelWeightsSchema = z.object({
  cruzamento: z.number().min(0).max(1),
  grafo: z.number().min(0).max(1),
  cadastro: z.number().min(0).max(1),
  historico: z.number().min(0).max(1),
});
export type RiskModelWeights = z.infer<typeof RiskModelWeightsSchema>;

/*
  Limiares (0..100). Regra de negócio: 0 < baixo < medio < alto < critico ≤ 100.
  A validação cruzada roda no publish (`validateRiskModelConfig`) — o schema
  aqui só garante o intervalo e a presença.
*/
export const RiskModelBandsSchema = z.object({
  baixo: z.number().min(0).max(100),
  medio: z.number().min(0).max(100),
  alto: z.number().min(0).max(100),
  critico: z.number().min(0).max(100),
});
export type RiskModelBands = z.infer<typeof RiskModelBandsSchema>;

export const RiskModelRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  category: RiskFactorOriginSchema,
  enabled: z.boolean(),
});
export type RiskModelRule = z.infer<typeof RiskModelRuleSchema>;

export const RiskModelConfigSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string(),
  updatedBy: z.string(),
  updatedByRole: RoleSchema,
  weights: RiskModelWeightsSchema,
  bands: RiskModelBandsSchema,
  rules: z.array(RiskModelRuleSchema).min(1),
});
export type RiskModelConfig = z.infer<typeof RiskModelConfigSchema>;

/*
  Registro imutável de alteração da configuração (T19 — cadeia de custódia).
  `summary` é gerado no cliente antes de publicar; `fieldsChanged` mantém a
  lista de campos para diff futuro sem depender de comparação estrutural.
*/
export const RiskModelChangeSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  actorRole: RoleSchema,
  correlationId: z.string(),
  fromVersion: z.string(),
  toVersion: z.string(),
  summary: z.string().min(1),
  fieldsChanged: z.array(z.string()).default([]),
});
export type RiskModelChange = z.infer<typeof RiskModelChangeSchema>;

/*
  Payload de publicação vindo da UI. O backend real recalculará `version`,
  `updatedAt` e enriquecerá com dados do usuário autenticado (T03).
*/
export const RiskModelPublishRequestSchema = z.object({
  weights: RiskModelWeightsSchema,
  bands: RiskModelBandsSchema,
  rules: z.array(RiskModelRuleSchema).min(1),
  summary: z.string().min(1),
  fieldsChanged: z.array(z.string()).default([]),
});
export type RiskModelPublishRequest = z.infer<typeof RiskModelPublishRequestSchema>;

export const RiskModelPublishResponseSchema = z.object({
  config: RiskModelConfigSchema,
  change: RiskModelChangeSchema,
});
export type RiskModelPublishResponse = z.infer<typeof RiskModelPublishResponseSchema>;
