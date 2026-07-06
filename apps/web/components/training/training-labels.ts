import type {
  DecisionAction,
  TipoDivergencia,
  TrainingDifficulty,
} from "@fiscalcheck/shared-types";

/* Rótulos pt-BR do Ambiente de Treinamento (T20 · módulo 6). */

export const DIFICULDADE_LABEL: Record<TrainingDifficulty, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const DIFICULDADE_BADGE_VARIANT: Record<TrainingDifficulty, "success" | "info" | "warning"> =
  {
    iniciante: "success",
    intermediario: "info",
    avancado: "warning",
  };

export const TIPO_DIVERGENCIA_LABEL: Record<TipoDivergencia, string> = {
  subdeclaracao: "Subdeclaração",
  omissao: "Omissão",
  regime_incorreto: "Regime incorreto",
  endereco_inconsistente: "Endereço inconsistente",
  socio_vinculado: "Sócio vinculado",
  inativo_atividade: "Inativo com atividade",
};

export const DECISAO_LABEL: Record<DecisionAction, string> = {
  aprovar: "Aprovar recomendação",
  ajustar: "Ajustar recomendação",
  rejeitar: "Rejeitar / arquivar",
};

export const DECISAO_LABEL_CURTA: Record<DecisionAction, string> = {
  aprovar: "Aprovar",
  ajustar: "Ajustar",
  rejeitar: "Rejeitar",
};
