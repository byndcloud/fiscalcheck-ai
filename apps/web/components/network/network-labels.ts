import type { NetworkEdgeTipo, NetworkEsquema, NetworkNodeTipo } from "@fiscalcheck/shared-types";

/*
  Labels e mapa de cores do grafo (T12) — segue o DS §8: PJ vermelho,
  sócio azul, endereço cinza, fornecedor âmbar; vínculo societário
  sólido azul, endereço tracejado cinza, financeiro âmbar.
  Só tokens existentes (zero hex novo fora dos já definidos no DS).
*/

export const NODE_TIPO_LABEL: Record<NetworkNodeTipo, string> = {
  empresa: "Pessoa jurídica",
  socio: "Sócio (PF)",
  endereco: "Endereço",
  fornecedor: "Fornecedor",
};

export const NODE_COLOR: Record<NetworkNodeTipo, string> = {
  empresa: "var(--c-risk-5)",
  socio: "var(--c-brand)",
  endereco: "var(--n-500)",
  fornecedor: "var(--c-risk-3)",
};

export const EDGE_TIPO_LABEL: Record<NetworkEdgeTipo, string> = {
  societario: "Societário",
  endereco: "Mesmo endereço",
  financeiro: "Fluxo financeiro",
};

export const EDGE_COLOR: Record<NetworkEdgeTipo, string> = {
  societario: "var(--c-brand-300)",
  endereco: "var(--n-300)",
  financeiro: "var(--c-risk-3)",
};

export const EDGE_DASH: Record<NetworkEdgeTipo, string | undefined> = {
  societario: undefined,
  endereco: "2.2 1.6",
  financeiro: undefined,
};

export const ESQUEMA_LABEL: Record<NetworkEsquema, string> = {
  fragmentacao_receita: "Fragmentação de receita",
  conluio_fornecedores: "Conluio de fornecedores",
  interposicao_pessoas: "Interposição de pessoas",
  endereco_compartilhado: "Endereço compartilhado",
  rede_familiar: "Rede familiar",
};
