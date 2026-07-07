import type {
  DeclaracaoResumo,
  DividaAtivaItem,
  NivelRisco,
  Pagamento,
  ScoreHistoricoPonto,
} from "@fiscalcheck/shared-types";

/*
  Históricos da Visão 360 (T08 · módulo 3 · RF03/FA03).
  Regras de coerência com o restante do mock:
  - o ÚLTIMO ponto de `scoreHistorico` bate com o `valor` atual em
    fixtures/scores.ts (calculadoEm 2026-07-02, risk-model-v2.4);
  - a versão do modelo em cada ponto segue o histórico de publicações de
    fixtures/risk-model.ts (v2.2 → v2.3 em 11/04 → v2.3.1 em 22/05 → v2.4 em 28/06);
  - as declarações narram os mesmos indícios dos fatores XAI (ex.: ct-009
    com receita de serviços zerada, ct-021 declarando ~28% abaixo).
  Contribuintes sem entrada aqui retornam históricos vazios na Visão 360 —
  é o caminho que exercita os empty states. Todos os valores são sintéticos
  (AGENTS.md §1.2 — sigilo fiscal).
*/

/** Versão do modelo vigente na data do cálculo, segundo fixtures/risk-model.ts. */
function modeloVersaoEm(data: string): string {
  if (data >= "2026-06-28") return "risk-model-v2.4";
  if (data >= "2026-05-22") return "risk-model-v2.3.1";
  if (data >= "2026-04-11") return "risk-model-v2.3";
  return "risk-model-v2.2";
}

/*
  Datas fixas dos recálculos mensais em lote — todo contribuinte pontuado
  compartilha o mesmo calendário, como faria o job real de scoring.
*/
const DATAS_RECALCULO = [
  "2026-02-02",
  "2026-03-02",
  "2026-04-15",
  "2026-05-25",
  "2026-06-08",
  "2026-07-02",
] as const;

function serie(valores: Array<[number, NivelRisco]>): ScoreHistoricoPonto[] {
  return valores.map(([valor, nivel], i) => {
    // Fixture estática: `valores` sempre tem 6 entradas casando com DATAS_RECALCULO.
    const data = DATAS_RECALCULO[i] as string;
    return { data, valor, nivel, modeloVersao: modeloVersaoEm(data) };
  });
}

export const scoreHistoricoFixture: Record<string, ScoreHistoricoPonto[]> = {
  "ct-001": serie([
    [61, "medio"],
    [64, "medio"],
    [69, "alto"],
    [73, "alto"],
    [78, "alto"],
    [82, "alto"],
  ]),
  "ct-002": serie([
    [38, "medio"],
    [36, "medio"],
    [41, "medio"],
    [40, "medio"],
    [46, "medio"],
    [44, "medio"],
  ]),
  "ct-003": serie([
    [72, "alto"],
    [76, "alto"],
    [81, "alto"],
    [85, "critico"],
    [88, "critico"],
    [91, "critico"],
  ]),
  "ct-004": serie([
    [15, "baixo"],
    [15, "baixo"],
    [15, "baixo"],
    [15, "baixo"],
    [15, "baixo"],
    [15, "baixo"],
  ]),
  "ct-005": serie([
    [44, "medio"],
    [47, "medio"],
    [52, "medio"],
    [58, "alto"],
    [60, "alto"],
    [62, "alto"],
  ]),
  "ct-006": serie([
    [79, "alto"],
    [80, "alto"],
    [82, "alto"],
    [84, "alto"],
    [86, "alto"],
    [87, "alto"],
  ]),
  "ct-007": serie([
    [66, "alto"],
    [69, "alto"],
    [74, "alto"],
    [80, "alto"],
    [85, "critico"],
    [88, "alto"],
  ]),
  "ct-009": serie([
    [51, "medio"],
    [55, "medio"],
    [61, "alto"],
    [66, "alto"],
    [71, "alto"],
    [74, "alto"],
  ]),
  "ct-010": serie([
    [63, "alto"],
    [67, "alto"],
    [72, "alto"],
    [77, "alto"],
    [81, "alto"],
    [84, "alto"],
  ]),
  "ct-013": serie([
    [70, "alto"],
    [74, "alto"],
    [79, "alto"],
    [83, "alto"],
    [86, "critico"],
    [89, "alto"],
  ]),
  "ct-015": serie([
    [58, "medio"],
    [60, "alto"],
    [63, "alto"],
    [65, "alto"],
    [67, "alto"],
    [69, "alto"],
  ]),
  "ct-019": serie([
    [60, "alto"],
    [63, "alto"],
    [67, "alto"],
    [70, "alto"],
    [73, "alto"],
    [76, "alto"],
  ]),
  "ct-021": serie([
    [68, "alto"],
    [71, "alto"],
    [75, "alto"],
    [79, "alto"],
    [82, "alto"],
    [84, "alto"],
  ]),
  "ct-031": serie([
    [77, "alto"],
    [81, "alto"],
    [85, "critico"],
    [88, "critico"],
    [91, "critico"],
    [93, "critico"],
  ]),
};

function decls(
  fonte: DeclaracaoResumo["fonte"],
  entries: Array<
    [competencia: string, receita: number, iss: number, status?: DeclaracaoResumo["status"]]
  >,
): DeclaracaoResumo[] {
  return entries.map(([competencia, receitaDeclarada, issApurado, status]) => ({
    competencia,
    fonte,
    receitaDeclarada,
    issApurado,
    status: status ?? "entregue",
  }));
}

export const declaracoesFixture: Record<string, DeclaracaoResumo[]> = {
  // Subdeclaração recorrente de 03 a 05/2026 (fator XAI "3 competências abaixo da média setorial").
  "ct-001": decls("des", [
    ["2026-01", 210_000, 4_200],
    ["2026-02", 205_000, 4_100],
    ["2026-03", 152_000, 3_040],
    ["2026-04", 148_000, 2_960],
    ["2026-05", 150_000, 3_000],
    ["2026-06", 168_000, 3_360],
  ]),
  // Regular no Simples; omissão pontual foi em NFS-e de exportação, não na entrega.
  "ct-002": decls("pgdas", [
    ["2026-01", 46_200, 924],
    ["2026-02", 44_800, 896],
    ["2026-03", 47_500, 950, "retificada"],
    ["2026-04", 45_100, 902],
    ["2026-05", 48_300, 966],
    ["2026-06", 46_900, 938],
  ]),
  // Faturamento em escala incompatível com o enquadramento (fator "acima do teto").
  "ct-003": decls("des", [
    ["2026-01", 412_000, 8_240],
    ["2026-02", 428_000, 8_560],
    ["2026-03", 447_000, 8_940],
    ["2026-04", 465_000, 9_300],
    ["2026-05", 471_000, 9_420],
    ["2026-06", 489_000, 9_780],
  ]),
  // Suspenso no cadastro e omisso nas entregas — mas com NFS-e no trimestre (divergência dv T05).
  "ct-004": decls("pgdas", [
    ["2026-01", 0, 0, "omissa"],
    ["2026-02", 0, 0, "omissa"],
    ["2026-03", 0, 0, "omissa"],
    ["2026-04", 0, 0, "omissa"],
    ["2026-05", 0, 0, "omissa"],
    ["2026-06", 0, 0, "omissa"],
  ]),
  "ct-005": decls("des", [
    ["2026-01", 38_400, 768],
    ["2026-02", 37_900, 758],
    ["2026-03", 39_600, 792],
    ["2026-04", 38_100, 762],
    ["2026-05", 40_200, 804],
    ["2026-06", 39_800, 796],
  ]),
  // Receita declarada ~31% abaixo das NFS-e (fator "subfaturamento sistemático").
  "ct-006": decls("des", [
    ["2026-01", 94_000, 1_880],
    ["2026-02", 91_500, 1_830],
    ["2026-03", 96_800, 1_936],
    ["2026-04", 93_200, 1_864],
    ["2026-05", 95_400, 1_908],
    ["2026-06", 97_100, 1_942],
  ]),
  // DIMP aponta R$ 96 mil/mês em cartão vs R$ 61 mil declarados.
  "ct-007": decls("des", [
    ["2026-01", 61_800, 1_236],
    ["2026-02", 60_400, 1_208],
    ["2026-03", 62_100, 1_242],
    ["2026-04", 61_500, 1_230],
    ["2026-05", 60_900, 1_218],
    ["2026-06", 61_200, 1_224],
  ]),
  // Receita de SERVIÇOS zerada em 6 competências (fator XAI) — comércio segue declarado.
  "ct-009": decls("des", [
    ["2026-01", 0, 0],
    ["2026-02", 0, 0],
    ["2026-03", 0, 0],
    ["2026-04", 0, 0],
    ["2026-05", 0, 0],
    ["2026-06", 0, 0],
  ]),
  "ct-010": decls("des", [
    ["2026-01", 52_300, 2_615],
    ["2026-02", 51_800, 2_590],
    ["2026-03", 53_100, 2_655],
    ["2026-04", 52_600, 2_630],
    ["2026-05", 52_900, 2_645],
    ["2026-06", 53_400, 2_670],
  ]),
  // Receita estável apesar da diferença de R$ 187,4 mil apontada pela DIMP.
  "ct-013": decls("des", [
    ["2026-01", 312_000, 6_240],
    ["2026-02", 308_000, 6_160],
    ["2026-03", 315_000, 6_300],
    ["2026-04", 310_000, 6_200],
    ["2026-05", 318_000, 6_360],
    ["2026-06", 314_000, 6_280],
  ]),
  // Diferença média de R$ 3,8 mil/mês entre agenda clínica e NFS-e.
  "ct-015": decls("des", [
    ["2026-01", 68_200, 1_364],
    ["2026-02", 67_500, 1_350],
    ["2026-03", 69_100, 1_382],
    ["2026-04", 68_800, 1_376],
    ["2026-05", 67_900, 1_358],
    ["2026-06", 68_400, 1_368],
  ]),
  // Receita estável enquanto o CMV cresceu 38% (fator "descolamento").
  "ct-019": decls("des", [
    ["2026-01", 241_000, 4_820],
    ["2026-02", 238_000, 4_760],
    ["2026-03", 243_000, 4_860],
    ["2026-04", 240_000, 4_800],
    ["2026-05", 242_000, 4_840],
    ["2026-06", 244_000, 4_880],
  ]),
  // Declaração mensal ~28% abaixo das NFS-e em 14 das 18 competências.
  "ct-021": decls("des", [
    ["2026-01", 88_300, 1_766],
    ["2026-02", 86_900, 1_738],
    ["2026-03", 89_500, 1_790],
    ["2026-04", 87_200, 1_744],
    ["2026-05", 88_800, 1_776],
    ["2026-06", 89_100, 1_782],
  ]),
  // Receita cobre só ~14% do valor das obras ativas (fator "incompatível").
  "ct-031": decls("des", [
    ["2026-01", 118_000, 2_360],
    ["2026-02", 121_000, 2_420],
    ["2026-03", 119_500, 2_390],
    ["2026-04", 122_000, 2_440],
    ["2026-05", 120_500, 2_410],
    ["2026-06", 123_000, 2_460],
  ]),
};

export const dividaAtivaFixture: Record<string, DividaAtivaItem[]> = {
  // 2 autuações anteriores mantidas em recurso (fator "histórico de autuações").
  "ct-001": [
    {
      id: "da-001-01",
      cda: "CDA-2023-****41",
      exercicio: 2023,
      tributo: "iss",
      valorAtualizado: 38_400,
      situacao: "inscrita",
      inscritaEm: "2023-11-18",
    },
    {
      id: "da-001-02",
      cda: "CDA-2024-****87",
      exercicio: 2024,
      tributo: "iss",
      valorAtualizado: 52_900,
      situacao: "parcelada",
      inscritaEm: "2024-09-05",
    },
  ],
  "ct-004": [
    {
      id: "da-004-01",
      cda: "CDA-2025-****12",
      exercicio: 2025,
      tributo: "iss",
      valorAtualizado: 12_700,
      situacao: "protestada",
      inscritaEm: "2025-06-30",
    },
  ],
  // Reincidência em autuações de 2023 e 2024 (fator XAI).
  "ct-006": [
    {
      id: "da-006-01",
      cda: "CDA-2023-****55",
      exercicio: 2023,
      tributo: "iss",
      valorAtualizado: 61_200,
      situacao: "inscrita",
      inscritaEm: "2023-12-04",
    },
    {
      id: "da-006-02",
      cda: "CDA-2024-****19",
      exercicio: 2024,
      tributo: "iss",
      valorAtualizado: 74_800,
      situacao: "inscrita",
      inscritaEm: "2024-10-21",
    },
  ],
  "ct-007": [
    {
      id: "da-007-01",
      cda: "CDA-2025-****73",
      exercicio: 2025,
      tributo: "iss",
      valorAtualizado: 22_300,
      situacao: "protestada",
      inscritaEm: "2025-08-14",
    },
  ],
  "ct-031": [
    {
      id: "da-031-01",
      cda: "CDA-2024-****66",
      exercicio: 2024,
      tributo: "iss",
      valorAtualizado: 68_500,
      situacao: "inscrita",
      inscritaEm: "2024-11-27",
    },
  ],
};

function pagamentosDam(
  prefixo: string,
  entries: Array<[competencia: string, valor: number, pagoEm: string]>,
): Pagamento[] {
  return entries.map(([competencia, valorPago, pagoEm], i) => ({
    id: `${prefixo}-${String(i + 1).padStart(2, "0")}`,
    competencia,
    tributo: "iss" as const,
    valorPago,
    pagoEm,
    origem: "dam" as const,
  }));
}

export const pagamentosFixture: Record<string, Pagamento[]> = {
  "ct-001": [
    ...pagamentosDam("pg-001", [
      ["2026-03", 3_040, "2026-04-10"],
      ["2026-04", 2_960, "2026-05-11"],
      ["2026-05", 3_000, "2026-06-10"],
    ]),
    {
      id: "pg-001-91",
      competencia: "2026-05",
      tributo: "iss",
      valorPago: 1_840,
      pagoEm: "2026-06-15",
      origem: "parcelamento",
    },
  ],
  "ct-002": pagamentosDam("pg-002", [
    ["2026-03", 950, "2026-04-08"],
    ["2026-04", 902, "2026-05-08"],
    ["2026-05", 966, "2026-06-09"],
  ]),
  "ct-005": pagamentosDam("pg-005", [
    ["2026-04", 762, "2026-05-12"],
    ["2026-05", 804, "2026-06-11"],
  ]),
  "ct-007": pagamentosDam("pg-007", [
    ["2026-03", 1_242, "2026-04-14"],
    ["2026-04", 1_230, "2026-05-15"],
  ]),
  "ct-013": pagamentosDam("pg-013", [
    ["2026-03", 6_300, "2026-04-09"],
    ["2026-04", 6_200, "2026-05-08"],
    ["2026-05", 6_360, "2026-06-09"],
  ]),
  "ct-015": [
    ...pagamentosDam("pg-015", [
      ["2026-04", 1_376, "2026-05-09"],
      ["2026-05", 1_358, "2026-06-10"],
    ]),
    // Regularização espontânea de 2025 (fator XAI "boa resposta a orientações").
    {
      id: "pg-015-90",
      competencia: "2025-08",
      tributo: "iss",
      valorPago: 9_640,
      pagoEm: "2025-09-22",
      origem: "autorregularizacao",
    },
  ],
  "ct-031": pagamentosDam("pg-031", [
    ["2026-04", 2_440, "2026-05-13"],
    ["2026-05", 2_410, "2026-06-12"],
  ]),
};

/*
  Estimativa de valor potencial recuperável usada na fila quando o
  contribuinte ainda NÃO tem caso com `valorPotencial` — o handler sempre
  prefere o valor do caso vinculado para manter coerência com o Kanban.
*/
export const valorPotencialEstimadoFixture: Record<string, number> = {
  "ct-001": 84_500,
  "ct-002": 9_800,
  "ct-003": 214_300,
  "ct-004": 12_700,
  "ct-005": 58_900,
  "ct-006": 132_400,
  "ct-007": 96_000,
  "ct-009": 47_800,
  "ct-010": 118_600,
  "ct-013": 187_400,
  "ct-015": 41_300,
  "ct-019": 96_800,
  "ct-021": 168_500,
  "ct-031": 486_200,
};
