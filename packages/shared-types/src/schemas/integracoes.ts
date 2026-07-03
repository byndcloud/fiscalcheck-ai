import { z } from "zod";

/*
  Contratos do módulo 1 (Ingestão e Qualidade) na visão de "Integrações":
  fontes cadastradas (NFS-e, DIMP, ECD, DEFIS, PGDAS-D, Cadastro Mobiliário,
  Dados Abertos), eventos da timeline do Agente 24/7 e cargas processadas
  para o Monitor de Cargas.

  A camada de mock (apps/web/mocks) já valida contra estes schemas — quando
  a API real subir, os handlers de MSW são desligados e os endpoints
  passam a servir o mesmo shape.
*/

export const ConnectorTypeSchema = z.enum([
  "NFSe",
  "DIMP",
  "ECD",
  "DEFIS",
  "PGDAS",
  "Cadastro",
  "DadosAbertos",
]);
export type ConnectorType = z.infer<typeof ConnectorTypeSchema>;

export const ConnectorStatusSchema = z.enum(["online", "degradado", "offline"]);
export type ConnectorStatus = z.infer<typeof ConnectorStatusSchema>;

export const ConnectorProtocolSchema = z.enum(["XML", "JSON", "CSV", "API", "SFTP"]);
export type ConnectorProtocol = z.infer<typeof ConnectorProtocolSchema>;

export const IntegrationSourceSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  tipo: ConnectorTypeSchema,
  protocolo: ConnectorProtocolSchema,
  status: ConnectorStatusSchema,
  ultimaCargaEm: z.string(),
  volumeIngerido: z.number().int().nonnegative(),
  pseudonimizado: z.boolean(),
  descricao: z.string().optional(),
});
export type IntegrationSource = z.infer<typeof IntegrationSourceSchema>;

export const IngestionAgentEventKindSchema = z.enum([
  "etl",
  "schema",
  "quality",
  "pseudo",
  "failure",
]);
export type IngestionAgentEventKind = z.infer<typeof IngestionAgentEventKindSchema>;

export const IngestionAgentEventSeveritySchema = z.enum(["info", "warn", "critical"]);
export type IngestionAgentEventSeverity = z.infer<typeof IngestionAgentEventSeveritySchema>;

export const IngestionAgentEventSchema = z.object({
  id: z.string().min(1),
  kind: IngestionAgentEventKindSchema,
  sourceId: z.string().min(1),
  sourceName: z.string().min(1),
  message: z.string().min(1),
  timestamp: z.string(),
  qualityPercent: z.number().min(0).max(100).optional(),
  recordsProcessed: z.number().int().nonnegative().optional(),
  severity: IngestionAgentEventSeveritySchema,
});
export type IngestionAgentEvent = z.infer<typeof IngestionAgentEventSchema>;

export const ValidationLogLevelSchema = z.enum(["info", "warn", "erro"]);
export type ValidationLogLevel = z.infer<typeof ValidationLogLevelSchema>;

export const ValidationLogEntrySchema = z.object({
  nivel: ValidationLogLevelSchema,
  mensagem: z.string().min(1),
  timestamp: z.string(),
});
export type ValidationLogEntry = z.infer<typeof ValidationLogEntrySchema>;

export const RejectedRecordSchema = z.object({
  linha: z.number().int().positive(),
  motivo: z.string().min(1),
  campo: z.string().optional(),
});
export type RejectedRecord = z.infer<typeof RejectedRecordSchema>;

export const IngestionLoadStatusSchema = z.enum([
  "recebido",
  "validando",
  "processado",
  "com_erro",
  "quarentena",
]);
export type IngestionLoadStatus = z.infer<typeof IngestionLoadStatusSchema>;

export const IngestionLoadSchema = z.object({
  id: z.string().min(1),
  fonte: ConnectorTypeSchema,
  fonteNome: z.string().min(1),
  registros: z.number().int().nonnegative(),
  rejeitadosPercent: z.number().min(0).max(100),
  status: IngestionLoadStatusSchema,
  pseudonimizado: z.boolean(),
  recebidoEm: z.string(),
  validationLog: z.array(ValidationLogEntrySchema).default([]),
  rejectedSamples: z.array(RejectedRecordSchema).default([]),
});
export type IngestionLoad = z.infer<typeof IngestionLoadSchema>;

/*
  Payload aceito pelo endpoint mock POST /ingestion/simulate-failure.
  Permite forçar uma falha crítica no conector escolhido para demonstrar
  o encadeamento com o sino (T01).
*/
export const SimulateFailurePayloadSchema = z.object({
  sourceId: z.string().min(1),
});
export type SimulateFailurePayload = z.infer<typeof SimulateFailurePayloadSchema>;
