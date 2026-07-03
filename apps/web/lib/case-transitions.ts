import type { DecisionAction, RecomendacaoAcao, StatusCaso } from "@fiscalcheck/shared-types";

/*
  Máquina de transição do módulo 4 (Gestão da Fiscalização) — T13.

  Regras:
  - `aprovar` avança o workflow; em `aguardando_aprovacao` o próximo
    status depende da `recomendacao.acao` (intimação → notificado,
    autorregularização → em_autorregularizacao, fiscalização → fiscalização).
  - `rejeitar` volta o caso ao estado anterior de análise (ou encerra
    quando o caso está no início).
  - `ajustar` mantém o caso no estado atual — serve apenas para
    registrar observação e recomeçar a análise; nenhuma mudança de
    status.
  - Casos em `encerrado` não aceitam novas transições (retorna `null`).

  O motor é puro (sem side-effects) e é reutilizado pelo handler MSW
  (POST /cases/:id/decisions) e pelo teste unitário.
*/

const BASE_TRANSITIONS: Record<StatusCaso, Partial<Record<DecisionAction, StatusCaso>>> = {
  candidato: {
    aprovar: "em_analise",
    rejeitar: "encerrado",
  },
  em_analise: {
    aprovar: "aguardando_aprovacao",
    rejeitar: "encerrado",
  },
  aguardando_aprovacao: {
    // aprovar é resolvido dinamicamente pela recomendação
    rejeitar: "em_analise",
  },
  notificado: {
    aprovar: "em_autorregularizacao",
    rejeitar: "fiscalizacao",
  },
  em_autorregularizacao: {
    aprovar: "encerrado",
    rejeitar: "fiscalizacao",
  },
  fiscalizacao: {
    aprovar: "encerrado",
  },
  encerrado: {},
};

const RECOMMENDATION_TO_STATUS: Record<RecomendacaoAcao, StatusCaso> = {
  intimacao: "notificado",
  autorregularizacao: "em_autorregularizacao",
  fiscalizacao: "fiscalizacao",
};

type NextStatusInput = {
  statusAtual: StatusCaso;
  action: DecisionAction;
  recomendacao?: RecomendacaoAcao;
};

export function nextStatus({
  statusAtual,
  action,
  recomendacao,
}: NextStatusInput): StatusCaso | null {
  if (action === "ajustar") {
    return statusAtual;
  }
  if (statusAtual === "aguardando_aprovacao" && action === "aprovar") {
    if (!recomendacao) return null;
    return RECOMMENDATION_TO_STATUS[recomendacao];
  }
  return BASE_TRANSITIONS[statusAtual][action] ?? null;
}

/*
  Retorna `true` se a decisão deve gerar documento no caso:
  aprovação em `aguardando_aprovacao` cuja recomendação seja
  intimação ou fiscalização emite termo. Autorregularização não emite
  termo formal — o contribuinte apenas recebe orientação.
*/
export function shouldEmitDocument(
  statusAtual: StatusCaso,
  action: DecisionAction,
  recomendacao?: RecomendacaoAcao,
): "termo_intimacao" | "termo_inicio_fiscalizacao" | null {
  if (statusAtual !== "aguardando_aprovacao" || action !== "aprovar") return null;
  if (recomendacao === "intimacao") return "termo_intimacao";
  if (recomendacao === "fiscalizacao") return "termo_inicio_fiscalizacao";
  return null;
}
