import { z } from "zod";

/*
  Metas do piloto (RF05 do edital — T17 · módulo 5). O piloto de
  Brusque prevê três metas oficiais:

    · acurácia do modelo de risco = 70%
    · ganho de escala (produtividade) = +100%
    · usabilidade (nota SUS) = 80%

  O status é derivado da razão de progresso e do prazo:

    progressoPct = (atual - baseline) / (alvo - baseline)
    · progresso >= 1.0 → `no_alvo`
    · progresso >= 0.6 ou prazo > 30d → `no_alvo`
    · 0.3 <= progresso < 0.6 e prazo <= 30d → `em_risco`
    · progresso < 0.3 e prazo <= 30d → `critico`

  A regra é calculada no MSW e vem hidratada pelo backend futuramente.
*/

export const MetaUnidadeSchema = z.enum(["pct", "num", "score"]);
export type MetaUnidade = z.infer<typeof MetaUnidadeSchema>;

export const MetaStatusSchema = z.enum(["no_alvo", "em_risco", "critico"]);
export type MetaStatus = z.infer<typeof MetaStatusSchema>;

export const MetaPilotoSchema = z.object({
  id: z.string().min(1),
  codigo: z.enum(["acuracia", "escala", "usabilidade"]),
  nome: z.string().min(1),
  descricao: z.string().min(1),
  unidade: MetaUnidadeSchema,
  baseline: z.number(),
  atual: z.number(),
  alvo: z.number(),
  progressoPct: z.number(),
  status: MetaStatusSchema,
  prazoEm: z.string(),
  atualizadoEm: z.string(),
  fonte: z.string().optional(),
});
export type MetaPiloto = z.infer<typeof MetaPilotoSchema>;
