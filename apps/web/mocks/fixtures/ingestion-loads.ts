import type { IngestionLoad } from "@fiscalcheck/shared-types";

/*
  Monitor de Cargas do módulo 1. Cada carga carrega o log de validação
  e uma amostra dos registros rejeitados — ambos alimentam o drawer
  do LoadsMonitor. Dados sintéticos (art. 198 CTN + LGPD).
*/
export const ingestionLoadsFixture: IngestionLoad[] = [
  {
    id: "LD-2026-0421",
    fonte: "NFSe",
    fonteNome: "NFS-e Brusque",
    registros: 3_412,
    rejeitadosPercent: 0.8,
    status: "processado",
    pseudonimizado: true,
    recebidoEm: "2026-07-02T13:12:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "Schema NFS-e v3.20 validado com sucesso.",
        timestamp: "2026-07-02T13:12:52Z",
      },
      {
        nivel: "info",
        mensagem: "Pseudonimização aplicada em 3.412 identificadores.",
        timestamp: "2026-07-02T13:13:41Z",
      },
      {
        nivel: "info",
        mensagem: "Qualidade dos dados aferida em 99,2%.",
        timestamp: "2026-07-02T13:14:20Z",
      },
    ],
    rejectedSamples: [
      { linha: 128, motivo: "Valor da nota abaixo do mínimo esperado.", campo: "valor_total" },
      {
        linha: 2_047,
        motivo: "Alíquota ISS fora da faixa permitida (0,0 – 5,0%).",
        campo: "aliquota_iss",
      },
    ],
  },
  {
    id: "LD-2026-0420",
    fonte: "DIMP",
    fonteNome: "DIMP · Cartões",
    registros: 11_204,
    rejeitadosPercent: 0.11,
    status: "processado",
    pseudonimizado: true,
    recebidoEm: "2026-07-02T10:07:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "Arquivo DIMP_2026_06.zip decodificado.",
        timestamp: "2026-07-02T10:07:00Z",
      },
      {
        nivel: "warn",
        mensagem: "12 registros com CNPJ inválido — encaminhados para quarentena.",
        timestamp: "2026-07-02T10:08:12Z",
      },
      {
        nivel: "info",
        mensagem: "Qualidade DIMP em 96,8% — dentro da tolerância operacional.",
        timestamp: "2026-07-02T10:08:15Z",
      },
    ],
    rejectedSamples: [
      {
        linha: 431,
        motivo: "CNPJ inválido (dígito verificador incorreto).",
        campo: "cnpj_estabelecimento",
      },
      {
        linha: 907,
        motivo: "CNPJ inválido (comprimento incorreto).",
        campo: "cnpj_estabelecimento",
      },
      {
        linha: 3_218,
        motivo: "Data de competência posterior ao mês de referência.",
        campo: "competencia",
      },
    ],
  },
  {
    id: "LD-2026-0419",
    fonte: "PGDAS",
    fonteNome: "PGDAS-D",
    registros: 812,
    rejeitadosPercent: 1.6,
    status: "validando",
    pseudonimizado: true,
    recebidoEm: "2026-07-02T08:44:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "Arquivo PGDAS_2026_06_partial.csv aceito.",
        timestamp: "2026-07-02T08:44:03Z",
      },
      {
        nivel: "info",
        mensagem: "Schema PGDAS-D layout 2026 em validação.",
        timestamp: "2026-07-02T08:45:07Z",
      },
    ],
    rejectedSamples: [],
  },
  {
    id: "LD-2026-0418",
    fonte: "DEFIS",
    fonteNome: "DEFIS · Anual",
    registros: 4_003,
    rejeitadosPercent: 2.17,
    status: "com_erro",
    pseudonimizado: true,
    recebidoEm: "2026-06-30T15:20:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "Arquivo DEFIS_2025_anual.xlsx aceito.",
        timestamp: "2026-06-30T15:20:12Z",
      },
      {
        nivel: "warn",
        mensagem: "Layout apresentou colunas desconhecidas: `receita_isenta_v2`.",
        timestamp: "2026-06-30T15:24:38Z",
      },
      {
        nivel: "erro",
        mensagem: "87 registros rejeitados por `receita_bruta` fora do domínio.",
        timestamp: "2026-06-30T15:31:04Z",
      },
    ],
    rejectedSamples: [
      {
        linha: 42,
        motivo: "Receita bruta anual acima do teto do Simples.",
        campo: "receita_bruta",
      },
      { linha: 118, motivo: "Receita bruta negativa.", campo: "receita_bruta" },
      { linha: 512, motivo: "Receita bruta ausente para o ano-base.", campo: "receita_bruta" },
      {
        linha: 999,
        motivo: "CNAE principal inválido para o regime declarado.",
        campo: "cnae_principal",
      },
      { linha: 1_204, motivo: "Sócio sem CPF preenchido.", campo: "socios[0].cpf" },
    ],
  },
  {
    id: "LD-2026-0417",
    fonte: "Cadastro",
    fonteNome: "Cadastro Mobiliário",
    registros: 322,
    rejeitadosPercent: 0.93,
    status: "quarentena",
    pseudonimizado: true,
    recebidoEm: "2026-07-02T07:10:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "Delta recebido via API do cadastro mobiliário.",
        timestamp: "2026-07-02T07:10:02Z",
      },
      {
        nivel: "warn",
        mensagem: "3 registros movidos para quarentena — endereço sem CEP.",
        timestamp: "2026-07-02T07:12:03Z",
      },
    ],
    rejectedSamples: [
      { linha: 12, motivo: "Endereço sem CEP.", campo: "endereco.cep" },
      { linha: 89, motivo: "Endereço sem CEP.", campo: "endereco.cep" },
      { linha: 201, motivo: "Endereço sem CEP.", campo: "endereco.cep" },
    ],
  },
  {
    id: "LD-2026-0416",
    fonte: "ECD",
    fonteNome: "ECD · Fiscobras",
    registros: 6_870,
    rejeitadosPercent: 0.06,
    status: "processado",
    pseudonimizado: true,
    recebidoEm: "2026-07-01T22:34:00Z",
    validationLog: [
      {
        nivel: "info",
        mensagem: "ECD 2026.06 recebida via SFTP.",
        timestamp: "2026-07-01T22:34:02Z",
      },
      {
        nivel: "info",
        mensagem: "Pseudonimização aplicada em 6.870 identificadores contábeis.",
        timestamp: "2026-07-01T22:36:11Z",
      },
    ],
    rejectedSamples: [
      {
        linha: 4_412,
        motivo: "Conta contábil desconhecida no plano padrão.",
        campo: "conta_contabil",
      },
    ],
  },
];
