import { z } from "zod";

/*
  Comunicações eletrônicas do módulo 4 (T15 · Central de Notificações
  Eletrônicas). Diferente de `Notificacao` (que representa o alerta
  in-app do sino no header), `Comunicacao` representa a notificação
  oficial enviada ao contribuinte por um canal digital, com valor
  probatório e rastreio ponta-a-ponta.

  Contrato temporário — quando a API real subir, o motor de envio real
  passa a alimentar `eventos` (append-only) e o hash do payload passa a
  ser assinado pela chave da SEFAZ municipal.
*/

export const CanalComunicacaoSchema = z.enum(["portal", "email", "sms", "whatsapp"]);
export type CanalComunicacao = z.infer<typeof CanalComunicacaoSchema>;

export const StatusComunicacaoSchema = z.enum([
  "enviada",
  "entregue",
  "ciencia",
  "respondida",
  "falha",
]);
export type StatusComunicacao = z.infer<typeof StatusComunicacaoSchema>;

/*
  Evento probatório (append-only). Cada ação sobre a comunicação gera
  uma linha imutável — a fixture do POC já traz `hashConteudo` sintético
  (SHA-256 mock) e ipOrigem/userAgent pseudonimizados.
*/
export const TipoEventoProbatorioSchema = z.enum([
  "envio",
  "entrega",
  "abertura",
  "ciencia_registrada",
  "resposta_recebida",
  "reenvio",
  "falha_temporaria",
]);
export type TipoEventoProbatorio = z.infer<typeof TipoEventoProbatorioSchema>;

export const EventoProbatorioSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  tipo: TipoEventoProbatorioSchema,
  hashConteudo: z.string().regex(/^[a-f0-9]{16,64}$/u, "hash deve ser hex de 16 a 64 chars."),
  ipOrigem: z.string().optional(),
  userAgent: z.string().optional(),
  detalhes: z.string().optional(),
});
export type EventoProbatorio = z.infer<typeof EventoProbatorioSchema>;

export const DestinatarioSchema = z.object({
  nome: z.string(),
  email: z.string().email().optional(),
  telefoneMascarado: z.string().optional(),
  portalUserId: z.string().optional(),
});
export type Destinatario = z.infer<typeof DestinatarioSchema>;

export const ComunicacaoSchema = z.object({
  id: z.string().min(1),
  protocolo: z.string().min(1),
  casoId: z.string().min(1),
  contribuinteId: z.string().min(1),
  canal: CanalComunicacaoSchema,
  status: StatusComunicacaoSchema,
  assunto: z.string().min(1),
  conteudoResumo: z.string().min(1),
  destinatario: DestinatarioSchema,
  documentoId: z.string().optional(),
  enviadaEm: z.string(),
  entregueEm: z.string().optional(),
  cienciaEm: z.string().optional(),
  respondidaEm: z.string().optional(),
  prazoRespostaEm: z.string().optional(),
  respostaConteudo: z.string().optional(),
  eventos: z.array(EventoProbatorioSchema).default([]),
});
export type Comunicacao = z.infer<typeof ComunicacaoSchema>;
