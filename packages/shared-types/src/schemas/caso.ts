import { z } from "zod";

/*
  Caso fiscal (módulo 4 — Gestão da Fiscalização).
  Toda transição de status deveria disparar um `AuditableAction`, mas o
  MSW não simula o log de auditoria — só devolve o estado agregado.

  T13 canonizou os 7 estados do workflow (candidato → em_analise →
  aguardando_aprovacao → notificado → em_autorregularizacao →
  fiscalizacao → encerrado). Estados antigos ("aberto",
  "aguardando_contribuinte", "autorregularizado", "arquivado") foram
  remapeados nos fixtures — quando a API real subir, uma migration
  precisa converter o legado. Deve virar ADR.
*/

export const StatusCasoSchema = z.enum([
  "candidato",
  "em_analise",
  "aguardando_aprovacao",
  "notificado",
  "em_autorregularizacao",
  "fiscalizacao",
  "encerrado",
]);
export type StatusCaso = z.infer<typeof StatusCasoSchema>;

/*
  Ação recomendada pelo Agente Orquestrador (módulo 4). A recomendação é
  estruturada — não uma string livre — para permitir explicabilidade
  (justificativa + confiança + divergências que embasam a decisão) e
  encadeamento na máquina de transição (`apps/web/lib/case-transitions.ts`).
*/
export const RecomendacaoAcaoSchema = z.enum(["intimacao", "autorregularizacao", "fiscalizacao"]);
export type RecomendacaoAcao = z.infer<typeof RecomendacaoAcaoSchema>;

export const RecomendacaoAgenteSchema = z.object({
  acao: RecomendacaoAcaoSchema,
  justificativa: z.string().min(1),
  confianca: z.number().min(0).max(1),
  baseadaEm: z.array(z.string()).default([]),
});
export type RecomendacaoAgente = z.infer<typeof RecomendacaoAgenteSchema>;

export const CasoSchema = z.object({
  id: z.string(),
  contribuinteId: z.string(),
  status: StatusCasoSchema,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  atribuidoA: z.string().optional(),
  agenteResponsavel: z.string().optional(),
  prazoLimite: z.string().optional(),
  scoreValor: z.number().min(0).max(100).optional(),
  divergenciaIds: z.array(z.string()).default([]),
  proximaAcaoRecomendada: z.string().optional(),
  recomendacao: RecomendacaoAgenteSchema.optional(),
  observacoes: z.string().optional(),
  /*
    Campos financeiros do POC — usados no card do Kanban e no dossiê.
    Nunca representam valor real de contribuinte: são estimativas
    sintéticas para demonstração.
  */
  valorPotencial: z.number().min(0).optional(),
  periodoApuracao: z.string().optional(),
  tributo: z.enum(["iss", "iptu", "itbi", "tld", "cosip"]).optional(),
});
export type Caso = z.infer<typeof CasoSchema>;
