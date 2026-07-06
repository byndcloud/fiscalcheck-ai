import { z } from "zod";

/*
  Análise de Redes / Graph Analytics (T12 · módulo 3 · RF08/FA09).

  Cada cenário é uma comunidade suspeita autocontida: nós (entidades),
  vínculos, padrões detectados e recomendação do agente. As posições
  (x/y em 0–100) vêm pré-calculadas no mock — na fase real, o layout
  sai do NetworkX/AGE no backend.

  Todos os dados são sintéticos; documentos sempre mascarados
  (AGENTS.md §1.2 — sigilo fiscal).
*/

export const NetworkNodeTipoSchema = z.enum(["empresa", "socio", "endereco", "fornecedor"]);
export type NetworkNodeTipo = z.infer<typeof NetworkNodeTipoSchema>;

export const NetworkNodeSchema = z.object({
  id: z.string().min(1),
  tipo: NetworkNodeTipoSchema,
  label: z.string().min(1),
  /** CNPJ/CPF mascarado ou complemento do endereço. */
  documento: z.string().optional(),
  /** Vínculo com o cadastro mobiliário quando a entidade é contribuinte. */
  contribuinteId: z.string().optional(),
  /** Posição no canvas (0–100, viewBox do SVG). */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  /** Score de risco de rede do nó (dimensiona o círculo). */
  scoreRede: z.number().min(0).max(100),
  /** Centralidade na comunidade (0–1) — indicador de articulação. */
  centralidade: z.number().min(0).max(1),
  /** Quantidade de ligações diretas com contribuintes já autuados. */
  ligacoesAutuados: z.number().int().nonnegative(),
  /** Resolução de entidades: identidades unificadas neste nó. */
  identidades: z.array(z.string()).default([]),
});
export type NetworkNode = z.infer<typeof NetworkNodeSchema>;

export const NetworkEdgeTipoSchema = z.enum(["societario", "endereco", "financeiro"]);
export type NetworkEdgeTipo = z.infer<typeof NetworkEdgeTipoSchema>;

export const NetworkEdgeSchema = z.object({
  id: z.string().min(1),
  origem: z.string().min(1),
  destino: z.string().min(1),
  tipo: NetworkEdgeTipoSchema,
  rotulo: z.string().optional(),
});
export type NetworkEdge = z.infer<typeof NetworkEdgeSchema>;

export const NetworkPatternSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  severidade: z.number().int().min(1).max(5),
});
export type NetworkPattern = z.infer<typeof NetworkPatternSchema>;

export const NetworkEsquemaSchema = z.enum([
  "fragmentacao_receita",
  "conluio_fornecedores",
  "interposicao_pessoas",
  "endereco_compartilhado",
  "rede_familiar",
]);
export type NetworkEsquema = z.infer<typeof NetworkEsquemaSchema>;

export const NetworkScenarioSchema = z.object({
  id: z.string().min(1),
  /** Código da comunidade suspeita (ex.: C-07). */
  codigo: z.string().min(1),
  titulo: z.string().min(1),
  esquema: NetworkEsquemaSchema,
  resumo: z.string().min(1),
  periodo: z.string().min(1),
  /** Score de risco da rede como um todo. */
  scoreRede: z.number().min(0).max(100),
  valorEstimado: z.number().nonnegative(),
  nos: z.array(NetworkNodeSchema).min(2),
  vinculos: z.array(NetworkEdgeSchema).min(1),
  padroes: z.array(NetworkPatternSchema).min(1),
  recomendacao: z.object({
    resumo: z.string().min(1),
    acaoSugerida: z.string().min(1),
  }),
  /** Caso consolidado no módulo 4 quando existir. */
  casoRelacionadoId: z.string().optional(),
});
export type NetworkScenario = z.infer<typeof NetworkScenarioSchema>;
