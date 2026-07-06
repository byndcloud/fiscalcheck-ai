import { z } from "zod";

/*
  Copilot Fiscal (T18 — RF10/FA11, módulo 6). Consulta em linguagem
  natural, sempre rotulada com fontes; nunca executa ação sobre o
  contribuinte (human-in-the-loop — AGENTS.md §1.1). Respostas são
  100% roteirizadas no mock (ver apps/web/mocks/fixtures/copilot-scripts.ts).
*/
export const CopilotSourceSchema = z.object({
  label: z.string(),
  ref: z.string().optional(),
});
export type CopilotSource = z.infer<typeof CopilotSourceSchema>;

export const CopilotMessageAuthorSchema = z.enum(["auditor", "copilot"]);
export type CopilotMessageAuthor = z.infer<typeof CopilotMessageAuthorSchema>;

export const CopilotMessageSchema = z.object({
  id: z.string(),
  autor: CopilotMessageAuthorSchema,
  texto: z.string(),
  fontes: z.array(CopilotSourceSchema).default([]),
  timestamp: z.string(),
});
export type CopilotMessage = z.infer<typeof CopilotMessageSchema>;

export const CopilotAskRequestSchema = z.object({
  pergunta: z.string().min(1),
  contextoCasoId: z.string().optional(),
});
export type CopilotAskRequest = z.infer<typeof CopilotAskRequestSchema>;

export const CopilotAskResponseSchema = z.object({
  mensagem: CopilotMessageSchema,
  sugestoes: z.array(z.string()).optional(),
});
export type CopilotAskResponse = z.infer<typeof CopilotAskResponseSchema>;
