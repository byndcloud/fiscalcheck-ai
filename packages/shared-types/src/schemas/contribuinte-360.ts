import { z } from "zod";

import { CasoSchema } from "./caso";
import { ContribuinteSchema } from "./contribuinte";
import { NFSeSchema } from "./nfse";
import { NivelRiscoSchema, ScoreSchema } from "./score";

/*
  Visão 360 do contribuinte (T08 · módulo 3 · RF03/FA03).
  Agregado read-only devolvido por `GET /taxpayers/:id/360`: o mock compõe
  cadastro + score + históricos numa resposta única para a página de detalhe.
  Todos os valores são sintéticos (AGENTS.md §1.2 — sigilo fiscal).
*/

export const StatusDeclaracaoSchema = z.enum(["entregue", "retificada", "omissa"]);
export type StatusDeclaracao = z.infer<typeof StatusDeclaracaoSchema>;

export const DeclaracaoResumoSchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/, {
    message: "Competência deve estar no formato YYYY-MM.",
  }),
  /** Fonte da declaração no município (PGDAS-D para o Simples, DES para os demais). */
  fonte: z.enum(["pgdas", "des"]),
  receitaDeclarada: z.number().nonnegative(),
  issApurado: z.number().nonnegative(),
  status: StatusDeclaracaoSchema,
});
export type DeclaracaoResumo = z.infer<typeof DeclaracaoResumoSchema>;

export const SituacaoDividaSchema = z.enum(["inscrita", "parcelada", "protestada", "quitada"]);
export type SituacaoDivida = z.infer<typeof SituacaoDividaSchema>;

export const DividaAtivaItemSchema = z.object({
  id: z.string(),
  /** Número da CDA (certidão de dívida ativa) — identificador mascarado. */
  cda: z.string(),
  exercicio: z.number().int(),
  tributo: z.enum(["iss", "iptu", "itbi", "tld", "cosip"]),
  valorAtualizado: z.number().nonnegative(),
  situacao: SituacaoDividaSchema,
  inscritaEm: z.string(),
});
export type DividaAtivaItem = z.infer<typeof DividaAtivaItemSchema>;

export const PagamentoSchema = z.object({
  id: z.string(),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, {
    message: "Competência deve estar no formato YYYY-MM.",
  }),
  tributo: z.enum(["iss", "iptu", "itbi", "tld", "cosip"]),
  valorPago: z.number().nonnegative(),
  pagoEm: z.string(),
  origem: z.enum(["dam", "parcelamento", "autorregularizacao"]),
});
export type Pagamento = z.infer<typeof PagamentoSchema>;

export const ScoreHistoricoPontoSchema = z.object({
  /** Data do cálculo (ISO 8601, apenas data) — eixo X do gráfico de evolução. */
  data: z.string(),
  valor: z.number().min(0).max(100),
  nivel: NivelRiscoSchema,
  modeloVersao: z.string(),
});
export type ScoreHistoricoPonto = z.infer<typeof ScoreHistoricoPontoSchema>;

export const Contribuinte360Schema = z.object({
  contribuinte: ContribuinteSchema,
  /** Score atual com fatores XAI (T09). Ausente quando ainda não pontuado. */
  score: ScoreSchema.optional(),
  scoreHistorico: z.array(ScoreHistoricoPontoSchema).default([]),
  declaracoes: z.array(DeclaracaoResumoSchema).default([]),
  nfse: z.array(NFSeSchema).default([]),
  dividaAtiva: z.array(DividaAtivaItemSchema).default([]),
  pagamentos: z.array(PagamentoSchema).default([]),
  casos: z.array(CasoSchema).default([]),
});
export type Contribuinte360 = z.infer<typeof Contribuinte360Schema>;
