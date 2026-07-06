import { z } from "zod";

import { StatusCasoSchema } from "./caso";
import { NivelRiscoSchema } from "./score";

/*
  Resultado unificado da busca global (T24 — transversal).

  O MSW resolve tudo do lado do servidor: `nivelRisco`/`scoreValor` já
  vêm casados com o score do contribuinte, e `casoRelacionadoId` resolve
  o caso mais recente do contribuinte — não existe "Visão 360" dedicada
  ainda, então selecionar um resultado de contribuinte abre o Dossiê
  desse caso relacionado (ver apps/web/mocks/handlers.ts).

  "cnpj" não é uma entidade própria: é o mesmo Contribuinte, mas marcado
  quando o termo buscado bateu no CNPJ/inscrição municipal em vez do
  nome — permite agrupar visualmente "encontrado pelo identificador" vs.
  "encontrado pelo nome", conforme pedido no ticket (Contribuinte, Caso,
  CNPJ/inscrição).
*/
export const SearchResultTypeSchema = z.enum(["contribuinte", "caso", "cnpj"]);
export type SearchResultType = z.infer<typeof SearchResultTypeSchema>;

export const SearchResultSchema = z.object({
  tipo: SearchResultTypeSchema,
  id: z.string(),
  titulo: z.string(),
  subtitulo: z.string().optional(),
  scoreValor: z.number().min(0).max(100).optional(),
  nivelRisco: NivelRiscoSchema.optional(),
  status: StatusCasoSchema.optional(),
  casoRelacionadoId: z.string().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
