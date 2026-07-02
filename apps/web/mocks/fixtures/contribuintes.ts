import type { Contribuinte } from "@fiscalcheck/shared-types";

/*
  Contribuintes sintéticos.
  Todos os CNPJs mascarados. Razões sociais fictícias. Nenhum dado real
  de contribuinte real de Brusque/SC (AGENTS.md §1.2 — sigilo fiscal).
*/
export const contribuintesFixture: Contribuinte[] = [
  {
    id: "ct-001",
    cnpjMascarado: "**.***.***/0001-42",
    razaoSocial: "Metalúrgica Nova Aurora Ltda.",
    nomeFantasia: "Nova Aurora",
    inscricaoMunicipal: "12345-6",
    regime: "lucro_presumido",
    situacao: "ativa",
    atividadePrincipal: "25.11-0 · Fabricação de estruturas metálicas",
    municipio: "Brusque",
    uf: "SC",
    endereco: "Rua Fictícia, 123 — Centro",
    socios: [
      { nome: "Marina G.", cpfMascarado: "***.***.***-11", participacao: 60 },
      { nome: "Ricardo T.", cpfMascarado: "***.***.***-22", participacao: 40 },
    ],
  },
  {
    id: "ct-002",
    cnpjMascarado: "**.***.***/0001-73",
    razaoSocial: "Tecelagem Vale do Itajaí Comércio ME",
    nomeFantasia: "Vale Têxtil",
    inscricaoMunicipal: "22987-1",
    regime: "simples_nacional",
    situacao: "ativa",
    atividadePrincipal: "13.30-8 · Fabricação de tecidos de malha",
    municipio: "Brusque",
    uf: "SC",
    socios: [{ nome: "Ana P.", cpfMascarado: "***.***.***-33", participacao: 100 }],
  },
  {
    id: "ct-003",
    cnpjMascarado: "**.***.***/0001-05",
    razaoSocial: "Confecções Sul Fashion Eireli",
    inscricaoMunicipal: "30456-9",
    regime: "lucro_real",
    situacao: "ativa",
    atividadePrincipal: "14.12-6 · Confecção de peças do vestuário",
    municipio: "Brusque",
    uf: "SC",
    socios: [
      { nome: "Bruno S.", cpfMascarado: "***.***.***-44", participacao: 55 },
      { nome: "Camila V.", cpfMascarado: "***.***.***-55", participacao: 45 },
    ],
  },
  {
    id: "ct-004",
    cnpjMascarado: "**.***.***/0001-88",
    razaoSocial: "Prestadora de Serviços Ícaro ME",
    inscricaoMunicipal: "44567-2",
    regime: "simples_nacional",
    situacao: "suspensa",
    atividadePrincipal: "62.09-1 · Suporte técnico em TI",
    municipio: "Brusque",
    uf: "SC",
  },
  {
    id: "ct-005",
    cnpjMascarado: "**.***.***/0001-19",
    razaoSocial: "Autoescola Rota Segura Ltda.",
    inscricaoMunicipal: "51230-4",
    regime: "lucro_presumido",
    situacao: "ativa",
    atividadePrincipal: "85.99-6 · Ensino de atividades complementares",
    municipio: "Brusque",
    uf: "SC",
    socios: [
      { nome: "Diego R.", cpfMascarado: "***.***.***-66", participacao: 80 },
      { nome: "Elisa M.", cpfMascarado: "***.***.***-77", participacao: 20 },
    ],
  },
];
