import { z } from "zod";

/*
  Divergência detectada pelo motor de cruzamento (módulo 2).
  Cada divergência sempre aponta para um contribuinte e traz evidências
  (IDs de NFS-e, arquivos, nós de grafo) para preservar a cadeia de
  custódia — pré-requisito de defensabilidade legal (AGENTS.md §1.1).
*/

export const OrigemDivergenciaSchema = z.enum([
  "declarado_vs_nfse",
  // RF 3.1.1 do TR: cruzamento com dados de meios de pagamento (DIMP) —
  // movimentação em cartões × receita declarada.
  "dimp_vs_declarado",
  "grafo_socios",
  "cadastro",
  "regime_incompativel",
  "atividade_incompativel",
]);
export type OrigemDivergencia = z.infer<typeof OrigemDivergenciaSchema>;

export const TipoDivergenciaSchema = z.enum([
  "subdeclaracao",
  "omissao",
  "regime_incorreto",
  "endereco_inconsistente",
  "socio_vinculado",
  // T05 (RF02): contribuinte inativo/suspenso no cadastro, mas com NFS-e emitidas.
  "inativo_atividade",
]);
export type TipoDivergencia = z.infer<typeof TipoDivergenciaSchema>;

export const SeveridadeSchema = z.number().int().min(1).max(5);
export type Severidade = z.infer<typeof SeveridadeSchema>;

export const DivergenciaSchema = z.object({
  id: z.string(),
  contribuinteId: z.string(),
  tipo: TipoDivergenciaSchema,
  origem: OrigemDivergenciaSchema,
  severidade: SeveridadeSchema,
  /** Diferença apurada (R$) — destaque da lista T05. Null quando a divergência não é monetária. */
  valor: z.number().nullable().optional(),
  /*
    Lado a lado do detalhe (T05): declarado × documentado em NFS-e.
    Opcionais porque divergências cadastrais/grafo não têm o par.
    Invariante esperada: valorApurado − valorDeclarado ≈ valor.
  */
  valorDeclarado: z.number().nonnegative().optional(),
  valorApurado: z.number().nonnegative().optional(),
  competencia: z
    .string()
    .regex(/^\d{4}-\d{2}$/, {
      message: "Competência deve estar no formato YYYY-MM.",
    })
    .optional(),
  descricao: z.string(),
  detectadoEm: z.string(),
  evidencias: z.array(z.string()).default([]),
});
export type Divergencia = z.infer<typeof DivergenciaSchema>;
