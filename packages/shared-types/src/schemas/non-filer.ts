import { z } from "zod";

/*
  Non-filer Discovery (T06 · módulo 2 · RF02).
  Prestadores "fora do radar": identificados por evidências indiretas
  (NFS-e de terceiros, meios de pagamento, fontes abertas) sem cadastro
  mobiliário ou declaração compatível. A fila é priorizada pela receita
  estimada não declarada — insumo para ampliação da base tributável.

  Nenhum dado real: nomes/documentos sintéticos e mascarados
  (AGENTS.md §1.2 — sigilo fiscal + LGPD).
*/

export const FonteIndicioSchema = z.enum(["nfse_terceiros", "meios_pagamento", "fonte_aberta"]);
export type FonteIndicio = z.infer<typeof FonteIndicioSchema>;

export const IndicioNonFilerSchema = z.object({
  fonte: FonteIndicioSchema,
  /** O que a fonte revelou, em linguagem de instrução de caso. */
  resumo: z.string().min(1),
  /** Receita estimada atribuível a este indício (R$, 12 meses). */
  valorEstimado: z.number().nonnegative(),
  /** Referência auditável da evidência (ex.: "14 NFS-e de tomadores locais"). */
  referencia: z.string().min(1),
});
export type IndicioNonFiler = z.infer<typeof IndicioNonFilerSchema>;

export const NonFilerStatusSchema = z.enum(["novo", "caso_aberto"]);
export type NonFilerStatus = z.infer<typeof NonFilerStatusSchema>;

export const NonFilerSchema = z.object({
  id: z.string().min(1),
  /** Nome indicado pelas evidências — não é razão social cadastrada. */
  nomeIndicado: z.string().min(1),
  documentoMascarado: z.string().min(1),
  atividadePresumida: z.string().min(1),
  municipio: z.string().min(1),
  indicios: z.array(IndicioNonFilerSchema).min(1),
  /** Estimativa de receita não declarada (R$, últimos 12 meses). */
  receitaEstimada12m: z.number().nonnegative(),
  detectadoEm: z.string(),
  status: NonFilerStatusSchema,
  /** Preenchido quando o auditor abre o caso candidato (inscrição de ofício). */
  casoId: z.string().optional(),
});
export type NonFiler = z.infer<typeof NonFilerSchema>;
