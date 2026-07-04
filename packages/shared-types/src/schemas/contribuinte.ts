import { z } from "zod";

/*
  Contribuinte pessoa jurídica.
  CNPJ e CPF de sócios sempre mascarados em qualquer camada que não seja
  o próprio banco (AGENTS.md §1.2 — sigilo fiscal + LGPD).
*/

export const RegimeTributarioSchema = z.enum([
  "simples_nacional",
  "lucro_presumido",
  "lucro_real",
  "mei",
]);
export type RegimeTributario = z.infer<typeof RegimeTributarioSchema>;

export const SituacaoCadastralSchema = z.enum(["ativa", "suspensa", "baixada", "inapta", "nula"]);
export type SituacaoCadastral = z.infer<typeof SituacaoCadastralSchema>;

export const SocioSchema = z.object({
  nome: z.string(),
  cpfMascarado: z.string(),
  participacao: z.number().min(0).max(100),
  /*
    Qualificação societária conforme QSA da Receita Federal
    (ex.: "Administrador", "Sócio-quotista", "Diretor", "Presidente").
    Campo opcional para não quebrar fixtures existentes.
  */
  qualificacao: z.string().optional(),
  /*
    Data de entrada no quadro societário (ISO 8601, apenas data).
    Útil para PDFs/relatórios que precisam identificar sócios recentes.
  */
  entradaEm: z.string().optional(),
});
export type Socio = z.infer<typeof SocioSchema>;

export const ContribuinteSchema = z.object({
  id: z.string(),
  cnpjMascarado: z.string(),
  razaoSocial: z.string(),
  nomeFantasia: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  regime: RegimeTributarioSchema,
  situacao: SituacaoCadastralSchema,
  atividadePrincipal: z.string().optional(),
  municipio: z.string().default("Brusque"),
  uf: z.string().length(2).default("SC"),
  endereco: z.string().optional(),
  socios: z.array(SocioSchema).optional(),
});
export type Contribuinte = z.infer<typeof ContribuinteSchema>;
