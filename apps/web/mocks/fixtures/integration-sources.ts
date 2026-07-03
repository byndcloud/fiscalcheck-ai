import type { IntegrationSource } from "@fiscalcheck/shared-types";

/*
  Fontes ingeridas pelo módulo 1. Dados sintéticos: nunca use conexões
  reais de produção como referência. `pseudonimizado: true` reflete que
  o pipeline aplicou hashing com salt em CPF/CNPJ antes de armazenar.

  DadosAbertos é a única fonte pública — portanto sem dado sensível
  para pseudonimizar.
*/
export const integrationSourcesFixture: IntegrationSource[] = [
  {
    id: "src-nfse",
    nome: "NFS-e Brusque",
    tipo: "NFSe",
    protocolo: "XML",
    status: "online",
    ultimaCargaEm: "2026-07-02T13:12:00Z",
    volumeIngerido: 3_412,
    pseudonimizado: true,
    descricao: "Notas fiscais eletrônicas emitidas por prestadores estabelecidos em Brusque/SC.",
  },
  {
    id: "src-dimp",
    nome: "DIMP · Cartões",
    tipo: "DIMP",
    protocolo: "JSON",
    status: "online",
    ultimaCargaEm: "2026-07-02T10:07:00Z",
    volumeIngerido: 11_204,
    pseudonimizado: true,
    descricao: "Declaração de Informações de Meios de Pagamento — operadoras de cartão.",
  },
  {
    id: "src-ecd",
    nome: "ECD · Fiscobras",
    tipo: "ECD",
    protocolo: "SFTP",
    status: "online",
    ultimaCargaEm: "2026-07-01T22:34:00Z",
    volumeIngerido: 6_870,
    pseudonimizado: true,
    descricao: "Escrituração Contábil Digital enviada por contadores parceiros.",
  },
  {
    id: "src-defis",
    nome: "DEFIS · Anual",
    tipo: "DEFIS",
    protocolo: "CSV",
    status: "degradado",
    ultimaCargaEm: "2026-06-30T15:31:00Z",
    volumeIngerido: 4_003,
    pseudonimizado: true,
    descricao: "Declaração do Simples Nacional — carga anual. Schema com divergência de layout.",
  },
  {
    id: "src-pgdas",
    nome: "PGDAS-D",
    tipo: "PGDAS",
    protocolo: "CSV",
    status: "online",
    ultimaCargaEm: "2026-07-02T08:44:00Z",
    volumeIngerido: 812,
    pseudonimizado: true,
    descricao: "Apuração mensal do Simples Nacional (PGDAS-D).",
  },
  {
    id: "src-cadastro",
    nome: "Cadastro Mobiliário",
    tipo: "Cadastro",
    protocolo: "API",
    status: "online",
    ultimaCargaEm: "2026-07-02T07:12:00Z",
    volumeIngerido: 322,
    pseudonimizado: true,
    descricao: "Deltas do cadastro mobiliário municipal — atualização incremental.",
  },
  {
    id: "src-dados-abertos",
    nome: "Dados Abertos · Gov.BR",
    tipo: "DadosAbertos",
    protocolo: "JSON",
    status: "offline",
    ultimaCargaEm: "2026-06-28T02:00:00Z",
    volumeIngerido: 0,
    pseudonimizado: false,
    descricao: "Bases públicas (CNAE, CEP, CNPJ) — endpoint upstream fora do ar desde 28/06.",
  },
];
