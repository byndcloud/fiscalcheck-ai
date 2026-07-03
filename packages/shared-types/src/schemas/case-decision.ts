import { z } from "zod";

import { StatusCasoSchema } from "./caso";
import { RoleSchema } from "./role";

/*
  Cadeia decisória de um caso (append-only). Cada `CaseDecision` é
  imutável — a fixture `apps/web/mocks/fixtures/case-decisions.ts`
  apenas empilha novas entradas.

  T13 exige: quem (atorId/Nome/Papel), quando (timestamp), o quê (action
  + status anterior/posterior + justificativa). `mfaVerified` sinaliza
  que o step-up MFA foi validado antes da mutação — quando T26 chegar,
  o campo passa a ser preenchido pelo motor real de MFA (não pelo
  cliente).
*/

export const DecisionActionSchema = z.enum(["aprovar", "rejeitar", "ajustar"]);
export type DecisionAction = z.infer<typeof DecisionActionSchema>;

export const CaseDecisionSchema = z.object({
  id: z.string().min(1),
  casoId: z.string().min(1),
  action: DecisionActionSchema,
  atorId: z.string().min(1),
  atorNome: z.string().min(1),
  atorPapel: RoleSchema,
  mfaVerified: z.boolean(),
  correlationId: z.string().min(1),
  timestamp: z.string(),
  justificativa: z.string().optional(),
  statusAnterior: StatusCasoSchema,
  statusPosterior: StatusCasoSchema,
  documentoGerado: z.string().optional(),
});
export type CaseDecision = z.infer<typeof CaseDecisionSchema>;

/*
  Payload aceito pelo endpoint mock `POST /cases/:id/decisions`.
  Justificativa é obrigatória quando `action === "rejeitar"` — validado
  no handler MSW e novamente no motor de transição.
*/
export const DecisionRequestSchema = z
  .object({
    action: DecisionActionSchema,
    mfaCode: z.string().regex(/^\d{6}$/u, "MFA deve conter 6 dígitos numéricos."),
    justificativa: z.string().min(20).optional(),
    observacoes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "rejeitar" && !data.justificativa) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["justificativa"],
        message: "Rejeitar exige justificativa com pelo menos 20 caracteres.",
      });
    }
  });
export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;
