import { z } from "zod";

/*
  Selos de conformidade (T19 · módulo 6).

  Cada selo representa um CONTROLE previsto no edital, com status
  operacional consumido pelo painel de Governança. A intenção é dar
  ao Admin / Supervisor uma visão de "cadeia de custódia" da própria
  plataforma — TLS, MFA, segregação, LGPD, RS04/RS08/RS09 e apoio ao
  RIPD.

  `status` é ordinal (ok < atencao < pendente); a UI pode usá-lo para
  ordenar do mais crítico ao regular. `metadata` fica aberto para
  informações contextuais (ex.: RS08 carrega `incidenteAbertoEm` para
  o countdown de 24h).
*/

export const ComplianceSealCodeSchema = z.enum([
  "tls_aes256",
  "mfa",
  "segregacao",
  "pseudonimizacao",
  "lgpd_ctn",
  "rs04_pentest",
  "rs09_retencao",
  "ripd",
]);
export type ComplianceSealCode = z.infer<typeof ComplianceSealCodeSchema>;

export const ComplianceSealStatusSchema = z.enum(["ok", "atencao", "pendente"]);
export type ComplianceSealStatus = z.infer<typeof ComplianceSealStatusSchema>;

export const ComplianceSealSchema = z.object({
  code: ComplianceSealCodeSchema,
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  status: ComplianceSealStatusSchema,
  evidencia: z.string().optional(),
  ultimaVerificacao: z.string().optional(),
  proximaRevisao: z.string().optional(),
  /*
    Metadata livre por selo — schema explícito só onde é consumido.
  */
  metadata: z.record(z.string(), z.string()).optional(),
});
export type ComplianceSeal = z.infer<typeof ComplianceSealSchema>;
