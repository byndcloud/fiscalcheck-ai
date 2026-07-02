import { z } from "zod";

/*
  Nota Fiscal de Serviço eletrônica (NFS-e) — mock simplificado.
  Não substitui o schema ABRASF completo do backend (módulo `ingestion`);
  aqui só o necessário para o cruzamento (módulo 2) e a UI.
*/

export const SituacaoNFSeSchema = z.enum(["emitida", "cancelada", "substituida"]);
export type SituacaoNFSe = z.infer<typeof SituacaoNFSeSchema>;

export const NFSeSchema = z.object({
  id: z.string(),
  numero: z.string(),
  serie: z.string().optional(),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, {
    message: "Competência deve estar no formato YYYY-MM.",
  }),
  dataEmissao: z.string(),
  prestadorId: z.string(),
  tomadorId: z.string(),
  valorServicos: z.number().nonnegative(),
  baseCalculo: z.number().nonnegative(),
  aliquota: z.number().min(0).max(100),
  iss: z.number().nonnegative(),
  situacao: SituacaoNFSeSchema,
  descricaoServico: z.string().optional(),
});
export type NFSe = z.infer<typeof NFSeSchema>;
