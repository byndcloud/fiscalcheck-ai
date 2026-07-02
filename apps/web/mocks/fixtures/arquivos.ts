import { z } from "zod";

/*
  Arquivo ingerido (módulo 1 — Ingestão e Qualidade). Fixture inline
  porque não está entre os 7 schemas principais; se virar contrato
  estável, promover para packages/shared-types.
*/
export const ArquivoIngeridoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  fonte: z.enum(["NFSe", "DIMP", "ECD", "DEFIS", "PGDAS", "Cadastro"]),
  tamanhoBytes: z.number().nonnegative(),
  linhas: z.number().int().nonnegative(),
  recebidoEm: z.string(),
  processadoEm: z.string().optional(),
  status: z.enum(["recebido", "validando", "processado", "com_erro", "quarentena"]),
  erros: z.number().int().nonnegative().default(0),
});
export type ArquivoIngerido = z.infer<typeof ArquivoIngeridoSchema>;

export const arquivosFixture: ArquivoIngerido[] = [
  {
    id: "arq-001",
    nome: "NFSE_2026_06_Brusque.xml",
    fonte: "NFSe",
    tamanhoBytes: 2_487_120,
    linhas: 3_412,
    recebidoEm: "2026-07-01T09:12:00Z",
    processadoEm: "2026-07-01T09:14:22Z",
    status: "processado",
    erros: 0,
  },
  {
    id: "arq-002",
    nome: "DIMP_2026_06.zip",
    fonte: "DIMP",
    tamanhoBytes: 8_912_004,
    linhas: 11_204,
    recebidoEm: "2026-07-01T10:03:00Z",
    processadoEm: "2026-07-01T10:07:11Z",
    status: "processado",
    erros: 12,
  },
  {
    id: "arq-003",
    nome: "PGDAS_2026_06_partial.csv",
    fonte: "PGDAS",
    tamanhoBytes: 512_000,
    linhas: 812,
    recebidoEm: "2026-07-02T08:44:00Z",
    status: "validando",
    erros: 0,
  },
  {
    id: "arq-004",
    nome: "DEFIS_2025_anual.xlsx",
    fonte: "DEFIS",
    tamanhoBytes: 4_120_000,
    linhas: 4_003,
    recebidoEm: "2026-06-30T15:20:00Z",
    processadoEm: "2026-06-30T15:31:04Z",
    status: "com_erro",
    erros: 87,
  },
  {
    id: "arq-005",
    nome: "Cadastro_mobiliario_delta.csv",
    fonte: "Cadastro",
    tamanhoBytes: 210_400,
    linhas: 322,
    recebidoEm: "2026-07-02T07:10:00Z",
    processadoEm: "2026-07-02T07:12:03Z",
    status: "quarentena",
    erros: 3,
  },
];
