import type { NFSe } from "@fiscalcheck/shared-types";

/*
  NFS-e sintéticas de suporte às divergências fixture.
  IDs `nf-*` batem com o campo `evidencias` de `divergenciasFixture`;
  IDs de contribuinte cobrem prestador e tomador (todos internos).

  Todos os valores são artificiais — nenhum contribuinte real
  (AGENTS.md §1.2 — sigilo fiscal + LGPD).
*/
export const nfseFixture: NFSe[] = [
  {
    id: "nf-1041",
    numero: "2026001041",
    serie: "A",
    competencia: "2026-05",
    dataEmissao: "2026-05-14T10:12:00Z",
    prestadorId: "ct-001",
    tomadorId: "ct-006",
    valorServicos: 68_400.0,
    baseCalculo: 68_400.0,
    aliquota: 3.0,
    iss: 2_052.0,
    situacao: "emitida",
    descricaoServico: "Serviço de usinagem de peças metálicas — lote 05/2026.",
  },
  {
    id: "nf-1042",
    numero: "2026001042",
    serie: "A",
    competencia: "2026-05",
    dataEmissao: "2026-05-21T15:48:00Z",
    prestadorId: "ct-001",
    tomadorId: "ct-013",
    valorServicos: 71_200.0,
    baseCalculo: 71_200.0,
    aliquota: 3.0,
    iss: 2_136.0,
    situacao: "emitida",
    descricaoServico: "Fornecimento de estruturas metálicas para engradado.",
  },
  {
    id: "nf-1043",
    numero: "2026001043",
    serie: "A",
    competencia: "2026-05",
    dataEmissao: "2026-05-27T09:03:00Z",
    prestadorId: "ct-001",
    tomadorId: "ct-025",
    valorServicos: 65_400.0,
    baseCalculo: 65_400.0,
    aliquota: 3.0,
    iss: 1_962.0,
    situacao: "emitida",
    descricaoServico: "Suportes metálicos sob medida — pedido interno 442.",
  },
  {
    id: "nf-2077",
    numero: "2026002077",
    serie: "B",
    competencia: "2026-06",
    dataEmissao: "2026-06-11T13:20:00Z",
    prestadorId: "ct-002",
    tomadorId: "ct-019",
    valorServicos: 7_800.0,
    baseCalculo: 7_800.0,
    aliquota: 2.0,
    iss: 156.0,
    situacao: "emitida",
    descricaoServico: "Tecidos de malha lisa 100% algodão — exportação.",
  },
  {
    id: "nf-2081",
    numero: "2026002081",
    serie: "B",
    competencia: "2026-06",
    dataEmissao: "2026-06-19T16:05:00Z",
    prestadorId: "ct-002",
    tomadorId: "ct-021",
    valorServicos: 4_500.0,
    baseCalculo: 4_500.0,
    aliquota: 2.0,
    iss: 90.0,
    situacao: "emitida",
    descricaoServico: "Malha estampada rolo 30m — exportação Uruguai.",
  },
];
