import type { Caso, CitizenInteracao, StatusCaso } from "@fiscalcheck/shared-types";

/*
  Rótulos do Portal do Contribuinte (T16 · módulo 4).
  O cidadão não vê o vocabulário interno da fiscalização ("candidato",
  "aguardando aprovação") — vê o estado da própria pendência em
  linguagem acolhedora e o passo em que está no fluxo de 3 etapas.
*/

export const CITIZEN_STATUS_LABEL: Record<StatusCaso, string> = {
  candidato: "Em verificação",
  em_analise: "Em verificação",
  aguardando_aprovacao: "Em verificação",
  notificado: "Aguardando sua ciência",
  em_autorregularizacao: "Regularização em andamento",
  fiscalizacao: "Em ação fiscal",
  encerrado: "Concluída",
};

export const CITIZEN_STATUS_TONE: Record<
  StatusCaso,
  "risk-1" | "risk-2" | "risk-3" | "risk-4" | "risk-5" | "neutral" | "info"
> = {
  candidato: "info",
  em_analise: "info",
  aguardando_aprovacao: "info",
  notificado: "risk-3",
  em_autorregularizacao: "risk-2",
  fiscalizacao: "risk-4",
  encerrado: "neutral",
};

export const TRIBUTO_LABEL: Record<NonNullable<Caso["tributo"]>, string> = {
  iss: "ISS — Imposto Sobre Serviços",
  iptu: "IPTU",
  itbi: "ITBI",
  tld: "Taxa de Licença",
  cosip: "COSIP",
};

export type CitizenStep = 1 | 2 | 3;

export function hasCiencia(caso: Caso, interacoes: CitizenInteracao[]): boolean {
  if (interacoes.some((i) => i.casoId === caso.id && i.tipo === "ciencia")) return true;
  // Casos que já avançaram de status tiveram a ciência registrada fora do portal.
  return caso.status === "em_autorregularizacao" || caso.status === "encerrado";
}

/**
 * Passo atual do fluxo acolhedor de 3 etapas:
 * 1. Ciência → 2. Regularização → 3. Confirmação.
 */
export function deriveStep(
  caso: Caso,
  interacoes: CitizenInteracao[],
): {
  current: CitizenStep;
  done: boolean;
} {
  if (caso.status === "encerrado") return { current: 3, done: true };
  if (caso.status === "em_autorregularizacao") return { current: 3, done: false };
  if (hasCiencia(caso, interacoes)) return { current: 2, done: false };
  return { current: 1, done: false };
}

export const CURRENCY_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});
