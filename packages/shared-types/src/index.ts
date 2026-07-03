/**
 * Tipos TS compartilhados entre apps/web e apps/api.
 *
 * Fase MVP: a geração via OpenAPI ainda NÃO está ativa. Os schemas Zod em
 * `./schemas` são a fonte da verdade temporária dos contratos entre a UI e
 * a camada de mock (MSW). Quando a API tiver endpoints reais:
 *   1. rodar `pnpm --filter @fiscalcheck/shared-types generate`;
 *   2. gradualmente migrar os schemas Zod para gerados do OpenAPI;
 *   3. reexportar `export type { paths, components } from "./openapi"`.
 * O arquivo `openapi.d.ts` gerado nunca deve ser editado à mão.
 */

import { z } from "zod";

export type AuditableAction = {
  action: string;
  actor_id: string;
  correlation_id: string;
  timestamp: string;
};

export const AuditableActionSchema = z.object({
  action: z.string(),
  actor_id: z.string(),
  correlation_id: z.string(),
  timestamp: z.string(),
}) satisfies z.ZodType<AuditableAction>;

export {
  RoleSchema,
  type Role,
} from "./schemas/role";

export {
  ContribuinteSchema,
  RegimeTributarioSchema,
  SituacaoCadastralSchema,
  SocioSchema,
  type Contribuinte,
  type RegimeTributario,
  type SituacaoCadastral,
  type Socio,
} from "./schemas/contribuinte";

export {
  NFSeSchema,
  SituacaoNFSeSchema,
  type NFSe,
  type SituacaoNFSe,
} from "./schemas/nfse";

export {
  DivergenciaSchema,
  OrigemDivergenciaSchema,
  SeveridadeSchema,
  TipoDivergenciaSchema,
  type Divergencia,
  type OrigemDivergencia,
  type Severidade,
  type TipoDivergencia,
} from "./schemas/divergencia";

export {
  FatorRiscoSchema,
  NivelRiscoSchema,
  ScoreSchema,
  type FatorRisco,
  type NivelRisco,
  type Score,
} from "./schemas/score";

export {
  CasoSchema,
  RecomendacaoAcaoSchema,
  RecomendacaoAgenteSchema,
  StatusCasoSchema,
  type Caso,
  type RecomendacaoAcao,
  type RecomendacaoAgente,
  type StatusCaso,
} from "./schemas/caso";

export {
  CaseDecisionSchema,
  DecisionActionSchema,
  DecisionRequestSchema,
  type CaseDecision,
  type DecisionAction,
  type DecisionRequest,
} from "./schemas/case-decision";

export {
  CaseDocumentKindSchema,
  CaseDocumentSchema,
  type CaseDocument,
  type CaseDocumentKind,
} from "./schemas/case-document";

export {
  NotificacaoSchema,
  TipoNotificacaoSchema,
  type Notificacao,
  type TipoNotificacao,
} from "./schemas/notificacao";

export {
  CanalComunicacaoSchema,
  ComunicacaoSchema,
  DestinatarioSchema,
  EventoProbatorioSchema,
  StatusComunicacaoSchema,
  TipoEventoProbatorioSchema,
  type CanalComunicacao,
  type Comunicacao,
  type Destinatario,
  type EventoProbatorio,
  type StatusComunicacao,
  type TipoEventoProbatorio,
} from "./schemas/comunicacao";

export {
  AgenteSchema,
  StatusAgenteSchema,
  TipoAgenteSchema,
  type Agente,
  type StatusAgente,
  type TipoAgente,
} from "./schemas/agente";

export {
  KpiMoMSchema,
  MonthlyRecoveryPointSchema,
  MonthlyRecoverySeriesSchema,
  PanelKpisSchema,
  RiskDistributionEntrySchema,
  RiskDistributionSchema,
  SmartAlertKindSchema,
  SmartAlertSchema,
  type KpiMoM,
  type MonthlyRecoveryPoint,
  type MonthlyRecoverySeries,
  type PanelKpis,
  type RiskDistribution,
  type RiskDistributionEntry,
  type SmartAlert,
  type SmartAlertKind,
} from "./schemas/analytics";
