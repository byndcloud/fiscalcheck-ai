import { z } from "zod";

/*
  Agente do sistema (LangGraph) — item de painel para o auditor entender
  o que a plataforma agêntica está fazendo (transparência é requisito
  legal para automação em fiscalização).
*/

export const TipoAgenteSchema = z.enum([
  "ingestao",
  "gatekeeper",
  "scoring",
  "orquestrador",
  "copilot",
]);
export type TipoAgente = z.infer<typeof TipoAgenteSchema>;

export const StatusAgenteSchema = z.enum(["ativo", "pausado", "erro", "inicializando"]);
export type StatusAgente = z.infer<typeof StatusAgenteSchema>;

export const AgenteSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: TipoAgenteSchema,
  status: StatusAgenteSchema,
  ultimaExecucao: z.string().optional(),
  proximaExecucao: z.string().optional(),
  totalExecucoes: z.number().int().nonnegative().default(0),
  descricao: z.string().optional(),
});
export type Agente = z.infer<typeof AgenteSchema>;
