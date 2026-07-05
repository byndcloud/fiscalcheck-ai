import { z } from "zod";

/*
  Avaliação de usabilidade pela escala SUS (System Usability Scale
  · Brooke, 1996). Instrumento oficial adotado pelo piloto de Brusque
  para medir a meta de usabilidade (=80).

  Regras:
    · 10 perguntas, respostas em Likert 1..5
    · Score = ((sum(impares_1..9) - 5) + (25 - sum(pares_2..10))) * 2.5
    · Score varia de 0 a 100; 68 é o limiar clássico de "aceitável".

  O cálculo fica no cliente (utilitário em apps/web/lib/analytics/sus.ts)
  e o resultado consolidado é o `score`; o schema mantém as respostas
  cruas para auditoria posterior.
*/

export const SusRespostaSchema = z.number().int().min(1).max(5);

export const SusAvaliacaoSchema = z.object({
  id: z.string().min(1),
  respondidoPor: z.string().min(1),
  respondidoEm: z.string(),
  respostas: z.array(SusRespostaSchema).length(10),
  score: z.number().min(0).max(100),
  comentario: z.string().optional(),
});
export type SusAvaliacao = z.infer<typeof SusAvaliacaoSchema>;

export const SusSubmitRequestSchema = z.object({
  respostas: z.array(SusRespostaSchema).length(10),
  comentario: z.string().max(500).optional(),
});
export type SusSubmitRequest = z.infer<typeof SusSubmitRequestSchema>;

export const SusSubmitResponseSchema = z.object({
  avaliacao: SusAvaliacaoSchema,
  novaMetaAtual: z.number().min(0).max(100),
});
export type SusSubmitResponse = z.infer<typeof SusSubmitResponseSchema>;
