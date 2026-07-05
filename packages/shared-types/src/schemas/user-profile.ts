import { z } from "zod";

import { RoleSchema } from "./role";

/*
  Perfil e preferências do usuário (T27 · Transversal).

  Contrato do menu do avatar no header: dados do usuário logado
  (nome, papel, e-mail), preferências de interface persistidas na
  camada de serviço fake e — apenas para o papel `cidadao` — os
  dados cadastrais detalhados junto à Prefeitura.

  Todos os dados são sintéticos (POC). CPF/CNPJ sempre mascarados
  no contrato: o backend real nunca deve trafegar o valor completo
  para esta tela (AGENTS.md §1.2).
*/

export const FontSizePreferenceSchema = z.enum(["padrao", "grande"]);
export type FontSizePreference = z.infer<typeof FontSizePreferenceSchema>;

export const DensityPreferenceSchema = z.enum(["confortavel", "compacta"]);
export type DensityPreference = z.infer<typeof DensityPreferenceSchema>;

export const UserPreferencesSchema = z.object({
  tamanhoFonte: FontSizePreferenceSchema,
  densidade: DensityPreferenceSchema,
  /** Liga/desliga alertas do sino (badge de não lidas). */
  notificacoesAtivas: z.boolean(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/* Empresa vinculada ao contribuinte no cadastro mobiliário. */
export const CitizenCompanyLinkSchema = z.object({
  cnpjMascarado: z.string(),
  razaoSocial: z.string(),
  inscricaoMunicipal: z.string(),
  /** Vínculo do cidadão com a empresa (ex.: "Sócia-administradora"). */
  vinculo: z.string(),
});
export type CitizenCompanyLink = z.infer<typeof CitizenCompanyLinkSchema>;

/*
  Dados cadastrais do contribuinte — exibidos apenas no perfil
  `cidadao`, em linguagem clara. Contato e endereço são editáveis
  pelo próprio cidadão; CPF e vínculos societários, não (mudam só
  por via formal — Junta Comercial / atendimento da Prefeitura).
*/
export const CitizenRegistrationSchema = z.object({
  cpfMascarado: z.string(),
  telefone: z.string(),
  endereco: z.string(),
  municipio: z.string(),
  uf: z.string(),
  empresasVinculadas: z.array(CitizenCompanyLinkSchema),
  atualizadoEm: z.string(),
});
export type CitizenRegistration = z.infer<typeof CitizenRegistrationSchema>;

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(2),
  email: z.string().email(),
  role: RoleSchema,
  /** Matrícula funcional — apenas papéis internos da Fazenda. */
  matricula: z.string().optional(),
  /** Presente apenas quando role === "cidadao". */
  dadosCadastrais: CitizenRegistrationSchema.optional(),
  preferencias: UserPreferencesSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

/*
  Campos que o cidadão pode editar sozinho no portal. Mensagens em
  linguagem clara — vão direto para o formulário (zodResolver).
*/
export const CitizenRegistrationUpdateRequestSchema = z
  .object({
    telefone: z
      .string()
      .trim()
      .min(10, "Informe um telefone com DDD, por exemplo (47) 99999-0000.")
      .max(20, "Telefone muito longo.")
      .optional(),
    endereco: z
      .string()
      .trim()
      .min(5, "Informe o endereço completo, com rua e número.")
      .max(160, "Endereço muito longo.")
      .optional(),
    municipio: z
      .string()
      .trim()
      .min(2, "Informe o município.")
      .max(60, "Nome de município muito longo.")
      .optional(),
    uf: z
      .string()
      .trim()
      .length(2, "Use a sigla do estado com 2 letras, por exemplo SC.")
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Altere ao menos um campo antes de salvar.",
  });
export type CitizenRegistrationUpdateRequest = z.infer<
  typeof CitizenRegistrationUpdateRequestSchema
>;

export const PreferencesUpdateRequestSchema = z
  .object({
    role: RoleSchema,
    preferencias: UserPreferencesSchema.partial(),
  })
  .refine((data) => Object.keys(data.preferencias).length > 0, {
    message: "Envie ao menos uma preferência para atualizar.",
    path: ["preferencias"],
  });
export type PreferencesUpdateRequest = z.infer<typeof PreferencesUpdateRequestSchema>;
