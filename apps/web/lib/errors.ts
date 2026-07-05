import { ApiError } from "@/lib/api-client";

/*
  Tratamento ÚNICO de erro para a UI (T25). Toda mensagem que o auditor
  ou o gestor vê passa por aqui. Regras:

    · pt-BR, tom orientador — nunca "algo deu errado" genérico se
      dermos para ser mais específico;
    · nunca vaza stack trace, path interno, código HTTP cru ou
      detalhe técnico da resposta;
    · quando há `ApiError.code` conhecido, respondemos com um par
      { title, description } curado; o `correlationId` continua
      disponível para o usuário reportar ao suporte;
    · fallback genérico só é usado se realmente não conhecemos o erro.

  Este mapa cresce com o produto — quando um novo code aparecer no
  MSW (ou no backend real), acrescente aqui + no teste em
  `tests/errors-resolve.test.ts`.
*/

export type ResolvedError = {
  /** Título curto — vira `toast.error(title)` e primeira linha do ErrorState. */
  title: string;
  /** Explicação em uma frase — orienta o próximo passo do usuário. */
  description: string;
  /** Se veio de `ApiError`, o code original — útil para telemetria/logs, nunca exibido cru. */
  code?: string;
  /** Correlation ID para rastreamento cruzado com a trilha. */
  correlationId?: string;
};

/*
  Códigos emitidos pelos handlers MSW (grep em mocks/handlers.ts).
  Repetimos aqui porque a fonte da verdade continua sendo o backend;
  a UI só provê o texto em pt-BR.
*/
const ERROR_CATALOG: Record<string, Omit<ResolvedError, "code" | "correlationId">> = {
  // RBAC / autorização
  forbidden_role: {
    title: "Ação não permitida para o seu papel",
    description:
      "Seu perfil atual não tem autorização para concluir esta ação. Verifique com o administrador.",
  },
  mfa_required: {
    title: "Autenticação reforçada exigida",
    description: "Antes de continuar, conclua a verificação em duas etapas (MFA).",
  },

  // 404 / recurso ausente
  case_not_found: {
    title: "Caso não encontrado",
    description: "O caso solicitado pode ter sido movido ou removido. Recarregue a fila.",
  },
  taxpayer_not_found: {
    title: "Contribuinte não encontrado",
    description: "Não localizamos este contribuinte na base atual.",
  },
  communication_not_found: {
    title: "Comunicação não encontrada",
    description: "Este protocolo não está mais disponível ou foi removido da central.",
  },
  notification_not_found: {
    title: "Notificação não encontrada",
    description: "A notificação pode já ter sido processada por outro dispositivo.",
  },
  user_not_found: {
    title: "Usuário não encontrado",
    description: "Verifique o cadastro operacional de usuários (Módulo 6).",
  },
  atypical_not_found: {
    title: "Acesso atípico não encontrado",
    description: "Este evento pode ter sido revogado ou já bloqueado por outro administrador.",
  },

  // 400 / body inválido — texto orientador, não técnico
  invalid_decision_body: {
    title: "Não foi possível registrar a decisão",
    description: "Confira os campos obrigatórios e a justificativa antes de enviar novamente.",
  },
  invalid_transition: {
    title: "Transição não permitida para este caso",
    description: "O caso está em um estado que não aceita esta ação. Recarregue e tente de novo.",
  },
  invalid_risk_model_body: {
    title: "Modelo de risco inválido",
    description: "Revise pesos e faixas antes de publicar uma nova versão.",
  },
  invalid_risk_bands: {
    title: "Faixas de score inconsistentes",
    description:
      "As faixas precisam seguir 0 < baixo < médio < alto < crítico ≤ 100. Ajuste os valores.",
  },
  invalid_export_body: {
    title: "Não foi possível preparar a exportação",
    description: "Alguns campos obrigatórios do payload não estão preenchidos.",
  },
  invalid_report_body: {
    title: "Parâmetros do relatório incompletos",
    description: "Selecione ao menos uma seção e revise período e formato antes de gerar.",
  },
  invalid_sus_body: {
    title: "Respostas da avaliação SUS inválidas",
    description: "Cada resposta deve ser um número inteiro entre 1 e 5. Revise antes de enviar.",
  },
  invalid_sus_answers: {
    title: "Não foi possível calcular o SUS",
    description: "Confira se todas as 10 perguntas foram respondidas antes de enviar.",
  },
  invalid_block_body: {
    title: "Justificativa insuficiente para bloqueio",
    description:
      "Informe uma justificativa clara antes de bloquear este acesso atípico (trilha auditável).",
  },
  invalid_user_body: {
    title: "Dados do usuário inválidos",
    description: "Revise nome, e-mail, matrícula e papel antes de salvar.",
  },
  invalid_credentials_body: {
    title: "Credenciais incompletas",
    description: "Preencha e-mail (ou CPF/CNPJ) e senha antes de continuar.",
  },
  meta_nao_aceita_sus: {
    title: "Meta não aceita avaliação SUS",
    description: "A pesquisa SUS só se aplica à meta de usabilidade do piloto.",
  },

  // Conflito (409)
  user_email_conflict: {
    title: "E-mail já cadastrado",
    description: "Já existe um usuário ativo com este e-mail. Use outro ou reative o cadastro.",
  },
  user_matricula_conflict: {
    title: "Matrícula já cadastrada",
    description: "Já existe um usuário com esta matrícula. Verifique o cadastro operacional.",
  },

  // Schema do MSW quebrou (contrato) — mensagem clara pra dev, sem stack
  mock_schema_violation: {
    title: "Contrato do mock desalinhado",
    description:
      "A fixture não bate com o schema declarado. Este ambiente de demonstração precisa ser recarregado.",
  },
};

const NETWORK_MESSAGE_HINTS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
];

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return NETWORK_MESSAGE_HINTS.some((hint) => msg.includes(hint));
}

/**
 * Converte qualquer erro (ApiError, Error, unknown) em par
 * `{ title, description }` seguro para exibição.
 *
 * Nunca use `error.message` direto na UI — passe por aqui.
 */
export function resolveErrorMessage(error: unknown): ResolvedError {
  if (error instanceof ApiError) {
    const catalog = ERROR_CATALOG[error.code];
    if (catalog) {
      return { ...catalog, code: error.code, correlationId: error.correlationId };
    }
    // ApiError sem code mapeado: usa mensagem já normalizada pelo backend/mock,
    // que por contrato (`mocks/handlers.ts`) já é pt-BR e amigável, sem stack.
    if (error.status === 401 || error.status === 403) {
      return {
        title: "Acesso não autorizado",
        description:
          error.message ||
          "Sua sessão pode ter expirado ou seu perfil não tem permissão para esta ação.",
        code: error.code,
        correlationId: error.correlationId,
      };
    }
    if (error.status === 404) {
      return {
        title: "Registro não encontrado",
        description: error.message || "Este item pode ter sido removido ou movido.",
        code: error.code,
        correlationId: error.correlationId,
      };
    }
    if (error.status >= 500) {
      return {
        title: "O serviço está temporariamente indisponível",
        description:
          "Tente novamente em alguns instantes. Se persistir, informe o suporte com o código de rastreamento.",
        code: error.code,
        correlationId: error.correlationId,
      };
    }
    return {
      title: "Não foi possível concluir a operação",
      description: error.message || "Revise os dados e tente novamente.",
      code: error.code,
      correlationId: error.correlationId,
    };
  }

  if (isNetworkError(error)) {
    return {
      title: "Falha na conexão",
      description:
        "Verifique sua conexão com a rede e recarregue a página. Nada foi enviado ao servidor.",
    };
  }

  if (error instanceof Error) {
    // Não vaza `error.message` direto — pode conter detalhe técnico.
    return {
      title: "Não foi possível concluir a operação",
      description: "Tente novamente. Se o problema continuar, informe o suporte.",
    };
  }

  return {
    title: "Erro inesperado",
    description: "Recarregue a página e tente novamente.",
  };
}
