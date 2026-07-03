/*
  Formatação monetária BRL usada no dossiê, no kanban, na lista de casos
  e na exportação em PDF (T28). Centralizado aqui para garantir que a
  cifra impressa na peça processual seja idêntica à mostrada na UI —
  auditor e revisor precisam bater ao centavo (AGENTS.md §4.3).

  `Intl.NumberFormat` é reutilizado (não instanciado a cada chamada) —
  criar um formatter por render tem custo notório em listas longas.
*/

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return BRL_FORMATTER.format(value);
}
