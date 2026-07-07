import type { Divergencia, TipoDivergencia } from "@fiscalcheck/shared-types";

/*
  Rótulos e derivações da tela de Cruzamento (T05 · módulo 2 · RF02).
  Setor é derivado da divisão CNAE (2 primeiros dígitos) da atividade
  principal do contribuinte — suficiente para o filtro do edital sem
  criar campo novo no cadastro.
*/

export const TIPO_LABEL: Record<TipoDivergencia, string> = {
  subdeclaracao: "Subdeclaração",
  omissao: "Omissão",
  regime_incorreto: "Regime incorreto",
  endereco_inconsistente: "Endereço inconsistente",
  socio_vinculado: "Sócio vinculado",
  inativo_atividade: "Inativo com atividade",
};

export const ORIGEM_LABEL: Record<Divergencia["origem"], string> = {
  declarado_vs_nfse: "Declarado × NFS-e",
  dimp_vs_declarado: "DIMP × Declarado (cartões)",
  grafo_socios: "Grafo societário",
  cadastro: "Cadastro mobiliário",
  regime_incompativel: "Regime incompatível",
  atividade_incompativel: "Atividade incompatível",
};

const CNAE_SETOR: Record<string, string> = {
  "10": "Alimentação",
  "13": "Têxtil e confecção",
  "14": "Têxtil e confecção",
  "25": "Metalurgia e indústria",
  "31": "Metalurgia e indústria",
  "41": "Construção",
  "45": "Comércio",
  "46": "Comércio",
  "47": "Comércio",
  "49": "Transporte e logística",
  "55": "Hotelaria e eventos",
  "56": "Alimentação",
  "62": "TI e serviços profissionais",
  "68": "Imobiliário",
  "69": "TI e serviços profissionais",
  "74": "TI e serviços profissionais",
  "75": "Saúde e bem-estar",
  "77": "Transporte e logística",
  "85": "Educação",
  "86": "Saúde e bem-estar",
  "93": "Saúde e bem-estar",
  "96": "Saúde e bem-estar",
};

export function setorFromAtividade(atividadePrincipal: string | undefined): string {
  const divisao = atividadePrincipal?.slice(0, 2);
  return (divisao && CNAE_SETOR[divisao]) || "Outros serviços";
}

/* Faixas de valor do filtro (diferença apurada em R$). */
export const FAIXAS_VALOR = [
  { id: "todas", label: "Qualquer valor", min: 0, max: Number.POSITIVE_INFINITY },
  { id: "ate-25k", label: "Até R$ 25 mil", min: 0, max: 25_000 },
  { id: "25k-100k", label: "R$ 25 mil a R$ 100 mil", min: 25_000, max: 100_000 },
  { id: "acima-100k", label: "Acima de R$ 100 mil", min: 100_000, max: Number.POSITIVE_INFINITY },
] as const;

export type FaixaValorId = (typeof FAIXAS_VALOR)[number]["id"];

export function formatCompetencia(competencia: string | undefined): string {
  if (!competencia) return "—";
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
}
