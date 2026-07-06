import { z } from "zod";

import { RoleSchema } from "./role";

/*
  Colaboração no caso (T14 · módulo 4 · RF04).

  - Anotações do auditor: append-only (como toda trilha do módulo 4) —
    nunca editadas ou removidas depois de registradas.
  - Tratamento de devolutiva: resposta formal do auditor a uma interação
    eletrônica do contribuinte (Acatar / Manter / Solicitar complemento),
    sempre com autoria + justificativa registradas (AGENTS.md §1.1).
*/

export const CaseAnnotationSchema = z.object({
  id: z.string().min(1),
  casoId: z.string().min(1),
  autorId: z.string().min(1),
  autorNome: z.string().min(1),
  autorPapel: RoleSchema,
  texto: z.string().min(1),
  criadoEm: z.string(),
});
export type CaseAnnotation = z.infer<typeof CaseAnnotationSchema>;

export const AnnotationRequestSchema = z.object({
  texto: z.string().min(5, "A anotação precisa ter pelo menos 5 caracteres.").max(2000),
});
export type AnnotationRequest = z.infer<typeof AnnotationRequestSchema>;

export const DevolutivaAcaoSchema = z.enum(["acatar", "manter", "solicitar_complemento"]);
export type DevolutivaAcao = z.infer<typeof DevolutivaAcaoSchema>;

export const DevolutivaTratamentoSchema = z.object({
  acao: DevolutivaAcaoSchema,
  justificativa: z.string().min(1),
  tratadoPorId: z.string().min(1),
  tratadoPorNome: z.string().min(1),
  tratadoEm: z.string(),
});
export type DevolutivaTratamento = z.infer<typeof DevolutivaTratamentoSchema>;

export const DevolutivaTratamentoRequestSchema = z.object({
  acao: DevolutivaAcaoSchema,
  justificativa: z
    .string()
    .min(10, "Justifique o tratamento com pelo menos 10 caracteres.")
    .max(1000),
});
export type DevolutivaTratamentoRequest = z.infer<typeof DevolutivaTratamentoRequestSchema>;

/*
  Pré-triagem do Agente Orquestrador sobre a devolutiva: recomendação
  não vinculante — quem decide é o auditor (human-in-the-loop).
*/
export const DevolutivaPreTriagemSchema = z.object({
  recomendacao: DevolutivaAcaoSchema,
  resumo: z.string().min(1),
  confianca: z.number().min(0).max(1),
});
export type DevolutivaPreTriagem = z.infer<typeof DevolutivaPreTriagemSchema>;
