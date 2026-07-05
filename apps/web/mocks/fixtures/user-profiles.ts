import type { Role, UserProfile } from "@fiscalcheck/shared-types";

/*
  Perfis fake por papel (T27 · Transversal).

  Um nome distinto por perfil para a demo alternar identidades de forma
  crível. O contribuinte ("Ana Paula Hoffmann") é a mesma "Ana P."
  sócia-administradora de ct-002 no cadastro mobiliário — os vínculos
  abaixo explicam por que o portal dela lista os casos de ct-002,
  ct-003 e ct-004 (CITIZEN_TAXPAYER_IDS nos handlers).

  Dados 100% sintéticos; CPF/CNPJ sempre mascarados.
*/

export type UserProfileSeed = Omit<UserProfile, "preferencias">;

export const userProfilesFixture: Record<Role, UserProfileSeed> = {
  auditor: {
    id: "usr-auditor-01",
    nome: "Marina Coelho Steinbach",
    email: "marina.steinbach@brusque.sc.gov.br",
    role: "auditor",
    matricula: "AF-2031-0482",
  },
  supervisor: {
    id: "usr-supervisor-01",
    nome: "Ricardo Tavares Krieger",
    email: "ricardo.krieger@brusque.sc.gov.br",
    role: "supervisor",
    matricula: "GS-2019-0117",
  },
  admin: {
    id: "usr-admin-01",
    nome: "Patrícia Nunes Moser",
    email: "patricia.moser@brusque.sc.gov.br",
    role: "admin",
    matricula: "AD-2015-0009",
  },
  cidadao: {
    id: "usr-cidadao-01",
    nome: "Ana Paula Hoffmann",
    email: "ana.hoffmann@email.com.br",
    role: "cidadao",
    dadosCadastrais: {
      cpfMascarado: "***.***.***-33",
      telefone: "(47) 98***-**33",
      endereco: "Rua das Bromélias, 250 — Águas Claras",
      municipio: "Brusque",
      uf: "SC",
      empresasVinculadas: [
        {
          cnpjMascarado: "**.***.***/0001-73",
          razaoSocial: "Tecelagem Vale do Itajaí Comércio ME",
          inscricaoMunicipal: "22987-1",
          vinculo: "Sócia-administradora",
        },
        {
          cnpjMascarado: "**.***.***/0001-05",
          razaoSocial: "Confecções Sul Fashion Eireli",
          inscricaoMunicipal: "30456-9",
          vinculo: "Procuradora legal",
        },
        {
          cnpjMascarado: "**.***.***/0001-88",
          razaoSocial: "Prestadora de Serviços Ícaro ME",
          inscricaoMunicipal: "44567-2",
          vinculo: "Titular",
        },
      ],
      atualizadoEm: "2026-05-18T10:00:00-03:00",
    },
  },
  agente_sistema: {
    id: "usr-agente-01",
    nome: "Agente FiscalCheck",
    email: "agente@fiscalcheck.internal",
    role: "agente_sistema",
  },
};
