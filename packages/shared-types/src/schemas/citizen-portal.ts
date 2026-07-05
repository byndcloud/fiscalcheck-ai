import { z } from "zod";

import { CasoSchema } from "./caso";

/*
  Portal do Contribuinte / Autorregularização (T16 · módulo 4 · RF07/FA05).

  Todas as interações do contribuinte com um caso geram protocolo e são
  registradas — a devolutiva aparece no caso do Auditor Fiscal (T14) via
  notificação no sino + observações do caso. Nenhum dado fiscal é exposto
  sem sessão identificada (sigilo, art. 198 CTN — guard no AppShell).
*/

export const CitizenInteracaoTipoSchema = z.enum([
  "ciencia",
  "adesao_parcelamento",
  "guia_emitida",
  "contestacao",
  "agendamento",
]);
export type CitizenInteracaoTipo = z.infer<typeof CitizenInteracaoTipoSchema>;

/*
  Linha do tempo de acompanhamento em tempo real do contribuinte.
  Append-only no mock — cada ação empilha uma interação com protocolo.
*/
export const CitizenInteracaoSchema = z.object({
  id: z.string(),
  casoId: z.string(),
  tipo: CitizenInteracaoTipoSchema,
  protocolo: z.string(),
  resumo: z.string(),
  criadoEm: z.string(),
});
export type CitizenInteracao = z.infer<typeof CitizenInteracaoSchema>;

/*
  Guia de recolhimento mock (DAM — Documento de Arrecadação Municipal).
  `linhaDigitavel` é sintética; nunca representa arrecadação real.
*/
export const GuiaDamSchema = z.object({
  numero: z.string(),
  descricao: z.string(),
  valor: z.number().min(0),
  vencimento: z.string(),
  linhaDigitavel: z.string(),
  emitidaEm: z.string(),
});
export type GuiaDam = z.infer<typeof GuiaDamSchema>;

export const ParcelamentoAdesaoRequestSchema = z.object({
  parcelas: z.number().int().min(1).max(12),
});
export type ParcelamentoAdesaoRequest = z.infer<typeof ParcelamentoAdesaoRequestSchema>;

export const ContestacaoRequestSchema = z.object({
  assunto: z.string().min(5).max(120),
  mensagem: z.string().min(30).max(2000),
  arquivos: z
    .array(
      z.object({
        nome: z.string().min(1),
        tamanhoBytes: z.number().int().min(0),
      }),
    )
    .max(5)
    .default([]),
});
export type ContestacaoRequest = z.infer<typeof ContestacaoRequestSchema>;

export const AgendamentoRequestSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Data deve estar no formato YYYY-MM-DD.",
  }),
  periodo: z.enum(["manha", "tarde"]),
});
export type AgendamentoRequest = z.infer<typeof AgendamentoRequestSchema>;

/*
  Resposta padrão de toda ação do portal: a interação registrada (com
  protocolo), o caso atualizado (devolutiva refletida) e a guia quando a
  ação emite DAM.
*/
export const CitizenActionResponseSchema = z.object({
  interacao: CitizenInteracaoSchema,
  caso: CasoSchema,
  guia: GuiaDamSchema.optional(),
});
export type CitizenActionResponse = z.infer<typeof CitizenActionResponseSchema>;
