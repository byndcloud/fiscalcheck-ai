import type { Divergencia, TipoDivergencia } from "@fiscalcheck/shared-types";

/*
  Tradução das divergências para linguagem clara do cidadão
  (T16 · módulo 4 · RF07). Regra da skill frontend §3: mensagens ao
  cidadão não usam jargão fiscal (PGDAS, NFS-e, ECD) sem explicar.

  O texto nunca acusa — orienta. Tom acolhedor e não punitivo,
  conforme docs/design-system/design-system.md §8 (Canal do cidadão).
*/

type PlainExplanation = {
  titulo: string;
  explicacao: string;
  oQueFazer: string;
};

const TIPO_EXPLICACAO: Record<TipoDivergencia, PlainExplanation> = {
  subdeclaracao: {
    titulo: "Diferença entre o que foi declarado e as notas emitidas",
    explicacao:
      "As notas fiscais de serviço emitidas em seu nome somam um valor maior do que o informado na sua declaração mensal. Isso costuma acontecer por esquecimento ou erro de digitação na apuração.",
    oQueFazer:
      "Você pode regularizar emitindo a guia complementar ou parcelando o valor. Se acredita que há um engano, envie sua contestação com os comprovantes.",
  },
  omissao: {
    titulo: "Notas fiscais sem declaração correspondente",
    explicacao:
      "Encontramos notas fiscais de serviço emitidas em seu nome que não aparecem na sua declaração do período. Pode ser um serviço que ficou de fora da apuração.",
    oQueFazer:
      "Confira as notas do período indicado. Você pode complementar a declaração e emitir a guia, ou nos explicar o motivo pela contestação.",
  },
  regime_incorreto: {
    titulo: "Enquadramento tributário desatualizado",
    explicacao:
      "O faturamento registrado indica que sua empresa pode ter ultrapassado o limite do regime tributário atual (Simples Nacional). Quando isso acontece, o enquadramento precisa ser revisto.",
    oQueFazer:
      "Procure seu contador para confirmar o faturamento acumulado. Se preferir, agende um atendimento com a equipe da Fazenda para orientação.",
  },
  endereco_inconsistente: {
    titulo: "Endereço cadastrado precisa de confirmação",
    explicacao:
      "O endereço registrado para sua empresa apresentou inconsistência em nossa verificação. Manter o cadastro atualizado evita problemas com notificações e alvarás.",
    oQueFazer:
      "Confirme ou atualize o endereço da empresa. Se o endereço estiver correto, envie uma contestação com um comprovante recente.",
  },
  socio_vinculado: {
    titulo: "Vínculo societário em verificação",
    explicacao:
      "Identificamos um vínculo entre sócios da sua empresa e outra empresa com pendências cadastrais. É uma verificação de rotina — nenhuma irregularidade foi confirmada.",
    oQueFazer:
      "Nenhuma ação é obrigatória neste momento. Se quiser esclarecer o vínculo, use o canal de contestação ou agende um atendimento.",
  },
  inativo_atividade: {
    titulo: "Empresa sem atividade no cadastro, mas com notas emitidas",
    explicacao:
      "O cadastro da sua empresa consta como inativo ou suspenso, porém encontramos notas fiscais de serviço emitidas no período. Pode ser que a reativação não tenha sido registrada.",
    oQueFazer:
      "Atualize a situação cadastral da empresa ou, se houver engano, envie uma contestação com os documentos que comprovem a situação correta.",
  },
};

const CURRENCY_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function explainDivergencia(divergencia: Divergencia): PlainExplanation {
  return TIPO_EXPLICACAO[divergencia.tipo];
}

/** Frase única de resumo com o valor envolvido (quando existir). */
export function summarizeValor(divergencia: Divergencia): string | null {
  if (divergencia.valor === null || divergencia.valor === undefined) return null;
  return `Valor identificado na verificação: ${CURRENCY_BRL.format(divergencia.valor)}.`;
}

export type { PlainExplanation };
