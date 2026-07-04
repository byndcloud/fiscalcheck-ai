import { z } from "zod";

import { AuditLogEntrySchema } from "./audit-log";

/*
  Contrato do endpoint que registra a exportação do dossiê em PDF
  (T28 · módulo 4 — Gestão da Fiscalização).

  O PDF é gerado 100% client-side (ver ADR-0004). O papel do backend
  aqui é apenas RECEBER a intenção de export e produzir um evento
  append-only na trilha (T19), permitindo rastrear quem exportou qual
  peça processual e quando — pré-requisito de defensabilidade legal
  (AGENTS.md §1.1).
*/

export const DossieExportFormatSchema = z.enum(["pdf"]);
export type DossieExportFormat = z.infer<typeof DossieExportFormatSchema>;

export const DossieExportRequestSchema = z.object({
  format: DossieExportFormatSchema.default("pdf"),
  /*
    Correlation id GERADO NO CLIENTE antes da geração do Blob. É
    impresso no rodapé do PDF e usado como chave do evento na
    trilha — permite conferir que o PDF em mãos corresponde ao
    registro auditável (chain of custody).
  */
  correlationId: z.string().min(1),
  /*
    Metadados só para contextualizar o evento na trilha; não
    substituem o dossiê em si (que é o PDF).
  */
  totalDivergencias: z.number().int().min(0),
  scoreValor: z.number().min(0).max(100).optional(),
});
export type DossieExportRequest = z.infer<typeof DossieExportRequestSchema>;

/*
  A resposta ecoa o evento gravado, para o cliente atualizar a
  UI (badge "exportado" no dossiê, invalidar a query da trilha).
*/
export const DossieExportResponseSchema = z.object({
  entry: AuditLogEntrySchema,
});
export type DossieExportResponse = z.infer<typeof DossieExportResponseSchema>;
