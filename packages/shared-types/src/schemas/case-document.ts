import { z } from "zod";

/*
  Documentos gerados pelo módulo 4 (Gestão da Fiscalização): termo de
  intimação e termo de início de fiscalização. O POC mantém o conteúdo
  em markdown para renderização inline; a geração real de PDF fica para
  módulo dedicado com armazenamento em bucket + hash SHA-256 para a
  cadeia de custódia.
*/

export const CaseDocumentKindSchema = z.enum([
  "termo_intimacao",
  "termo_inicio_fiscalizacao",
]);
export type CaseDocumentKind = z.infer<typeof CaseDocumentKindSchema>;

export const CaseDocumentSchema = z.object({
  id: z.string().min(1),
  casoId: z.string().min(1),
  kind: CaseDocumentKindSchema,
  numero: z.string().min(1),
  emitidoEm: z.string(),
  emitidoPor: z.string().min(1),
  conteudo: z.string().min(1),
});
export type CaseDocument = z.infer<typeof CaseDocumentSchema>;
