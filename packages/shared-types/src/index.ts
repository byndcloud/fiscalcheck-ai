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
  FonteIndicioSchema,
  IndicioNonFilerSchema,
  NonFilerSchema,
  NonFilerStatusSchema,
  type FonteIndicio,
  type IndicioNonFiler,
  type NonFiler,
  type NonFilerStatus,
} from "./schemas/non-filer";

export {
  CtcAlertSchema,
  CtcBatchSchema,
  CtcFeedSchema,
  type CtcAlert,
  type CtcBatch,
  type CtcFeed,
} from "./schemas/ctc";

export {
  AnnotationRequestSchema,
  CaseAnnotationSchema,
  DevolutivaAcaoSchema,
  DevolutivaPreTriagemSchema,
  DevolutivaTratamentoRequestSchema,
  DevolutivaTratamentoSchema,
  type AnnotationRequest,
  type CaseAnnotation,
  type DevolutivaAcao,
  type DevolutivaPreTriagem,
  type DevolutivaTratamento,
  type DevolutivaTratamentoRequest,
} from "./schemas/case-collab";

export {
  AlvaraSituacaoSchema,
  GeoAlvaraSchema,
  GeoDeteccaoSchema,
  GeoFonteDeteccaoSchema,
  GeoObraSchema,
  GeoObraStatusSchema,
  GeoObraTipoSchema,
  type AlvaraSituacao,
  type GeoAlvara,
  type GeoDeteccao,
  type GeoFonteDeteccao,
  type GeoObra,
  type GeoObraStatus,
  type GeoObraTipo,
} from "./schemas/geo";

export {
  NetworkEdgeSchema,
  NetworkEdgeTipoSchema,
  NetworkEsquemaSchema,
  NetworkNodeSchema,
  NetworkNodeTipoSchema,
  NetworkPatternSchema,
  NetworkScenarioSchema,
  type NetworkEdge,
  type NetworkEdgeTipo,
  type NetworkEsquema,
  type NetworkNode,
  type NetworkNodeTipo,
  type NetworkPattern,
  type NetworkScenario,
} from "./schemas/network";

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
  NotificacaoOrigemSchema,
  NotificacaoSchema,
  TipoNotificacaoSchema,
  type Notificacao,
  type NotificacaoOrigem,
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

export {
  RiskFactorOriginSchema,
  RiskModelBandsSchema,
  RiskModelChangeSchema,
  RiskModelConfigSchema,
  RiskModelPublishRequestSchema,
  RiskModelPublishResponseSchema,
  RiskModelRuleSchema,
  RiskModelWeightsSchema,
  type RiskFactorOrigin,
  type RiskModelBands,
  type RiskModelChange,
  type RiskModelConfig,
  type RiskModelPublishRequest,
  type RiskModelPublishResponse,
  type RiskModelRule,
  type RiskModelWeights,
} from "./schemas/risk-model";

export {
  AtypicalAccessSchema,
  AuditLogEntrySchema,
  AuditLogResultSchema,
  BlockAtypicalRequestSchema,
  type AtypicalAccess,
  type AuditLogEntry,
  type AuditLogResult,
  type BlockAtypicalRequest,
} from "./schemas/audit-log";

export {
  SystemUserSchema,
  SystemUserStatusSchema,
  UserCreateRequestSchema,
  UserUpdateRequestSchema,
  type SystemUser,
  type SystemUserStatus,
  type UserCreateRequest,
  type UserUpdateRequest,
} from "./schemas/system-user";

export {
  ComplianceSealCodeSchema,
  ComplianceSealSchema,
  ComplianceSealStatusSchema,
  type ComplianceSeal,
  type ComplianceSealCode,
  type ComplianceSealStatus,
} from "./schemas/compliance-seal";

export {
  DossieExportFormatSchema,
  DossieExportRequestSchema,
  DossieExportResponseSchema,
  type DossieExportFormat,
  type DossieExportRequest,
  type DossieExportResponse,
} from "./schemas/dossie-export";

export {
  KpiTrendSchema,
  PanelManagerKpisSchema,
  PanelManagerPeriodoSchema,
  type KpiTrend,
  type PanelManagerKpis,
  type PanelManagerPeriodo,
} from "./schemas/panel-manager-kpis";

export {
  MetaPilotoSchema,
  MetaStatusSchema,
  MetaUnidadeSchema,
  type MetaPiloto,
  type MetaStatus,
  type MetaUnidade,
} from "./schemas/meta-piloto";

export {
  SusAvaliacaoSchema,
  SusRespostaSchema,
  SusSubmitRequestSchema,
  SusSubmitResponseSchema,
  type SusAvaliacao,
  type SusSubmitRequest,
  type SusSubmitResponse,
} from "./schemas/sus-avaliacao";

export {
  AgendamentoRequestSchema,
  CitizenActionResponseSchema,
  CitizenInteracaoSchema,
  CitizenInteracaoTipoSchema,
  ContestacaoRequestSchema,
  GuiaDamSchema,
  ParcelamentoAdesaoRequestSchema,
  type AgendamentoRequest,
  type CitizenActionResponse,
  type CitizenInteracao,
  type CitizenInteracaoTipo,
  type ContestacaoRequest,
  type GuiaDam,
  type ParcelamentoAdesaoRequest,
} from "./schemas/citizen-portal";

export {
  CitizenCompanyLinkSchema,
  CitizenRegistrationSchema,
  CitizenRegistrationUpdateRequestSchema,
  DensityPreferenceSchema,
  FontSizePreferenceSchema,
  PreferencesUpdateRequestSchema,
  UserPreferencesSchema,
  UserProfileSchema,
  type CitizenCompanyLink,
  type CitizenRegistration,
  type CitizenRegistrationUpdateRequest,
  type DensityPreference,
  type FontSizePreference,
  type PreferencesUpdateRequest,
  type UserPreferences,
  type UserProfile,
} from "./schemas/user-profile";

export {
  TrainingAttemptRequestSchema,
  TrainingAttemptResultSchema,
  TrainingCaseSchema,
  TrainingDifficultySchema,
  TrainingDivergenciaSchema,
  TrainingGabaritoSchema,
  TrainingTaxpayerSchema,
  type TrainingAttemptRequest,
  type TrainingAttemptResult,
  type TrainingCase,
  type TrainingDifficulty,
  type TrainingDivergencia,
  type TrainingGabarito,
  type TrainingTaxpayer,
} from "./schemas/training";

export {
  PeriodoSchema,
  RelatorioFormatoSchema,
  RelatorioGerencialRequestSchema,
  RelatorioGerencialResponseSchema,
  RelatorioSecaoSchema,
  RelatorioTipoSchema,
  type Periodo,
  type RelatorioFormato,
  type RelatorioGerencialRequest,
  type RelatorioGerencialResponse,
  type RelatorioSecao,
  type RelatorioTipo,
} from "./schemas/relatorio-gerencial";

export {
  SearchResultSchema,
  SearchResultTypeSchema,
  type SearchResult,
  type SearchResultType,
} from "./schemas/search";

export {
  CopilotAskRequestSchema,
  CopilotAskResponseSchema,
  CopilotMessageAuthorSchema,
  CopilotMessageSchema,
  CopilotSourceSchema,
  type CopilotAskRequest,
  type CopilotAskResponse,
  type CopilotMessage,
  type CopilotMessageAuthor,
  type CopilotSource,
} from "./schemas/copilot";
