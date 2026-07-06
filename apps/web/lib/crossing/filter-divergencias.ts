import type { Divergencia, TipoDivergencia } from "@fiscalcheck/shared-types";

import { FAIXAS_VALOR, type FaixaValorId } from "@/components/crossing/divergencia-labels";

/*
  Filtro combinável da lista de divergências (T05 · RF02).
  Regra: E entre dimensões (tipo, período, valor, setor), OU dentro dos
  chips de tipo. Função pura — golden tests em
  apps/web/tests/filter-divergencias.test.ts.
*/

export type DivergenciaFilters = {
  tipos: TipoDivergencia[];
  periodo: string; // "todas" ou competência "YYYY-MM"
  faixaValor: FaixaValorId;
  setor: string; // "todos" ou rótulo do setor
};

export const EMPTY_FILTERS: DivergenciaFilters = {
  tipos: [],
  periodo: "todas",
  faixaValor: "todas",
  setor: "todos",
};

export function filterDivergencias(
  divergencias: Divergencia[],
  filters: DivergenciaFilters,
  setorOf: (divergencia: Divergencia) => string,
): Divergencia[] {
  const faixa = FAIXAS_VALOR.find((f) => f.id === filters.faixaValor) ?? FAIXAS_VALOR[0];

  return divergencias.filter((dv) => {
    if (filters.tipos.length > 0 && !filters.tipos.includes(dv.tipo)) return false;
    if (filters.periodo !== "todas" && dv.competencia !== filters.periodo) return false;
    if (filters.faixaValor !== "todas") {
      // Faixa de valor só se aplica a divergências monetárias.
      if (dv.valor == null) return false;
      if (dv.valor < faixa.min || dv.valor >= faixa.max) return false;
    }
    if (filters.setor !== "todos" && setorOf(dv) !== filters.setor) return false;
    return true;
  });
}
