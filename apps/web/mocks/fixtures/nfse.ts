import type { NFSe } from "@fiscalcheck/shared-types";

import { divergenciasFixture } from "./divergencias";

/*
  NFS-e sintéticas de suporte às divergências fixture.
  IDs `nf-*` batem com o campo `evidencias` de `divergenciasFixture`;
  IDs de contribuinte cobrem prestador e tomador (todos internos).

  Duas camadas (mesma estratégia de divergencias.ts):
  1. Handcrafted — notas nominais dos casos de demonstração;
  2. Geradas — para toda divergência `declarado_vs_nfse` cuja evidência
     `nf-*` não exista à mão, duas notas que SOMAM exatamente o
     `valorApurado` (o cálculo da diferença no detalhe T05 fecha com a
     evidência apresentada).

  Todos os valores são artificiais — nenhum contribuinte real
  (AGENTS.md §1.2 — sigilo fiscal + LGPD).
*/
const handcrafted: NFSe[] = [
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
  // dv-006 / dv-052 — ct-004 (Ícaro TI, suspensa): NFS-e somam R$ 43.200,00
  {
    id: "nf-3110",
    numero: "2026003110",
    serie: "A",
    competencia: "2026-01",
    dataEmissao: "2026-01-16T09:40:00Z",
    prestadorId: "ct-004",
    tomadorId: "ct-013",
    valorServicos: 15_000.0,
    baseCalculo: 15_000.0,
    aliquota: 2.5,
    iss: 375.0,
    situacao: "emitida",
    descricaoServico: "Suporte técnico mensal — contrato 2026/01.",
  },
  {
    id: "nf-3112",
    numero: "2026003112",
    serie: "A",
    competencia: "2026-02",
    dataEmissao: "2026-02-14T11:05:00Z",
    prestadorId: "ct-004",
    tomadorId: "ct-013",
    valorServicos: 14_000.0,
    baseCalculo: 14_000.0,
    aliquota: 2.5,
    iss: 350.0,
    situacao: "emitida",
    descricaoServico: "Suporte técnico mensal — contrato 2026/02.",
  },
  {
    id: "nf-3119",
    numero: "2026003119",
    serie: "A",
    competencia: "2026-03",
    dataEmissao: "2026-03-17T15:22:00Z",
    prestadorId: "ct-004",
    tomadorId: "ct-026",
    valorServicos: 14_200.0,
    baseCalculo: 14_200.0,
    aliquota: 2.5,
    iss: 355.0,
    situacao: "emitida",
    descricaoServico: "Migração de servidores e backup — projeto pontual.",
  },
  // dv-007 — ct-007 (restaurante): NFS-e somam R$ 470.000,00
  {
    id: "nf-4021",
    numero: "2026004021",
    serie: "A",
    competencia: "2026-04",
    dataEmissao: "2026-04-12T10:00:00Z",
    prestadorId: "ct-007",
    tomadorId: "ct-026",
    valorServicos: 265_000.0,
    baseCalculo: 265_000.0,
    aliquota: 3.0,
    iss: 7_950.0,
    situacao: "emitida",
    descricaoServico: "Buffet completo — convenção corporativa 3 dias.",
  },
  {
    id: "nf-4022",
    numero: "2026004022",
    serie: "A",
    competencia: "2026-04",
    dataEmissao: "2026-04-26T18:30:00Z",
    prestadorId: "ct-007",
    tomadorId: "ct-031",
    valorServicos: 205_000.0,
    baseCalculo: 205_000.0,
    aliquota: 3.0,
    iss: 6_150.0,
    situacao: "emitida",
    descricaoServico: "Alimentação de canteiro — contrato mensal abril.",
  },
  // dv-008 — ct-007: NFS-e somam R$ 87.200,00
  {
    id: "nf-4030",
    numero: "2026004030",
    serie: "A",
    competencia: "2026-05",
    dataEmissao: "2026-05-09T12:15:00Z",
    prestadorId: "ct-007",
    tomadorId: "ct-019",
    valorServicos: 52_000.0,
    baseCalculo: 52_000.0,
    aliquota: 3.0,
    iss: 1_560.0,
    situacao: "emitida",
    descricaoServico: "Buffet — evento de lançamento de coleção.",
  },
  {
    id: "nf-4031",
    numero: "2026004031",
    serie: "A",
    competencia: "2026-05",
    dataEmissao: "2026-05-23T19:40:00Z",
    prestadorId: "ct-007",
    tomadorId: "ct-030",
    valorServicos: 35_200.0,
    baseCalculo: 35_200.0,
    aliquota: 3.0,
    iss: 1_056.0,
    situacao: "emitida",
    descricaoServico: "Coquetel de formatura — turma 2026/1.",
  },
  // dv-028 — ct-010 (imobiliária): NFS-e somam R$ 808.700,00
  {
    id: "nf-5102",
    numero: "2026005102",
    serie: "A",
    competencia: "2025-11",
    dataEmissao: "2025-11-18T09:00:00Z",
    prestadorId: "ct-010",
    tomadorId: "ct-031",
    valorServicos: 495_000.0,
    baseCalculo: 495_000.0,
    aliquota: 5.0,
    iss: 24_750.0,
    situacao: "emitida",
    descricaoServico: "Comissão de intermediação — empreendimento Colinas fase 2.",
  },
  {
    id: "nf-5103",
    numero: "2026005103",
    serie: "A",
    competencia: "2025-12",
    dataEmissao: "2025-12-15T14:20:00Z",
    prestadorId: "ct-010",
    tomadorId: "ct-026",
    valorServicos: 313_700.0,
    baseCalculo: 313_700.0,
    aliquota: 5.0,
    iss: 15_685.0,
    situacao: "emitida",
    descricaoServico: "Comissão de venda — unidades hoteleiras 12º andar.",
  },
];

/* ── Camada gerada ──────────────────────────────────────────────────── */

const TOMADORES_CICLO = ["ct-013", "ct-019", "ct-026", "ct-031", "ct-006"] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function generated(): NFSe[] {
  const existing = new Set(handcrafted.map((n) => n.id));
  const result: NFSe[] = [];

  for (const dv of divergenciasFixture) {
    if (dv.origem !== "declarado_vs_nfse" || !dv.valorApurado || !dv.competencia) continue;
    const pending = dv.evidencias.filter((ev) => ev.startsWith("nf-") && !existing.has(ev));
    if (pending.length === 0) continue;

    const num = Number.parseInt(dv.id.replace(/\D/g, ""), 10) || 0;
    // Divide o valorApurado entre as notas; a última leva o resíduo.
    const share = Math.round(dv.valorApurado / pending.length / 100) * 100;
    let restante = dv.valorApurado;

    pending.forEach((evId, index) => {
      existing.add(evId);
      const last = index === pending.length - 1;
      const valor = round2(last ? restante : share);
      restante = round2(restante - valor);
      const aliquota = 3.0;
      const dia = index === 0 ? "08" : "21";
      result.push({
        id: evId,
        numero: `2026${String(9000 + num * 2 + index).padStart(6, "0")}`,
        serie: "A",
        competencia: dv.competencia as string,
        dataEmissao: `${dv.competencia}-${dia}T10:00:00Z`,
        prestadorId: dv.contribuinteId,
        tomadorId: TOMADORES_CICLO[(num + index) % TOMADORES_CICLO.length] as string,
        valorServicos: valor,
        baseCalculo: valor,
        aliquota,
        iss: round2((valor * aliquota) / 100),
        situacao: "emitida",
        descricaoServico:
          "Serviços prestados no período — nota de suporte à evidência (sintética).",
      });
    });
  }

  return result;
}

export const nfseFixture: NFSe[] = [...handcrafted, ...generated()];
