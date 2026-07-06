import { describe, expect, it } from "vitest";

import type { Divergencia } from "@fiscalcheck/shared-types";

import { setorFromAtividade } from "@/components/crossing/divergencia-labels";
import { EMPTY_FILTERS, filterDivergencias } from "@/lib/crossing/filter-divergencias";

/*
  T05 — aceite "filtros combinam entre si": golden tests da função pura
  (E entre dimensões, OU dentro dos chips de tipo).
*/

function dv(partial: Partial<Divergencia> & { id: string }): Divergencia {
  return {
    contribuinteId: "ct-001",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 3,
    valor: 50_000,
    competencia: "2026-05",
    descricao: "Divergência sintética de teste.",
    detectadoEm: "2026-07-01T09:00:00Z",
    evidencias: [],
    ...partial,
  };
}

const SETOR_POR_CONTRIBUINTE: Record<string, string> = {
  "ct-001": "25.11-0 · Fabricação de estruturas metálicas",
  "ct-002": "13.30-8 · Fabricação de tecidos de malha",
  "ct-007": "56.11-2 · Restaurantes e similares",
};

const setorOf = (d: Divergencia) => setorFromAtividade(SETOR_POR_CONTRIBUINTE[d.contribuinteId]);

const base = [
  dv({ id: "a", tipo: "subdeclaracao", valor: 84_500, competencia: "2026-05" }),
  dv({ id: "b", tipo: "omissao", valor: 12_300, competencia: "2026-06", contribuinteId: "ct-002" }),
  dv({ id: "c", tipo: "socio_vinculado", valor: null, competencia: "2026-05" }),
  dv({
    id: "d",
    tipo: "inativo_atividade",
    valor: 178_200,
    competencia: "2026-05",
    contribuinteId: "ct-007",
  }),
];

describe("filterDivergencias (T05)", () => {
  it("sem filtros, devolve tudo", () => {
    expect(filterDivergencias(base, EMPTY_FILTERS, setorOf)).toHaveLength(4);
  });

  it("chips de tipo combinam em OU", () => {
    const result = filterDivergencias(
      base,
      { ...EMPTY_FILTERS, tipos: ["omissao", "inativo_atividade"] },
      setorOf,
    );
    expect(result.map((d) => d.id)).toEqual(["b", "d"]);
  });

  it("dimensões combinam em E: tipo + período", () => {
    const result = filterDivergencias(
      base,
      { ...EMPTY_FILTERS, tipos: ["subdeclaracao", "omissao"], periodo: "2026-05" },
      setorOf,
    );
    expect(result.map((d) => d.id)).toEqual(["a"]);
  });

  it("faixa de valor exclui não monetárias e respeita limites", () => {
    const ate25k = filterDivergencias(base, { ...EMPTY_FILTERS, faixaValor: "ate-25k" }, setorOf);
    expect(ate25k.map((d) => d.id)).toEqual(["b"]);

    const acima100k = filterDivergencias(
      base,
      { ...EMPTY_FILTERS, faixaValor: "acima-100k" },
      setorOf,
    );
    expect(acima100k.map((d) => d.id)).toEqual(["d"]);
  });

  it("setor deriva da divisão CNAE do contribuinte", () => {
    const result = filterDivergencias(base, { ...EMPTY_FILTERS, setor: "Alimentação" }, setorOf);
    expect(result.map((d) => d.id)).toEqual(["d"]);
  });

  it("as quatro dimensões juntas", () => {
    const result = filterDivergencias(
      base,
      {
        tipos: ["inativo_atividade"],
        periodo: "2026-05",
        faixaValor: "acima-100k",
        setor: "Alimentação",
      },
      setorOf,
    );
    expect(result.map((d) => d.id)).toEqual(["d"]);

    // Mudar UMA dimensão zera o resultado — prova de que todas se aplicam.
    const vazio = filterDivergencias(
      base,
      {
        tipos: ["inativo_atividade"],
        periodo: "2026-06",
        faixaValor: "acima-100k",
        setor: "Alimentação",
      },
      setorOf,
    );
    expect(vazio).toHaveLength(0);
  });
});
