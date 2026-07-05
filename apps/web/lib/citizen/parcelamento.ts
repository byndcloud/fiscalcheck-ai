/*
  Simulador de parcelamento do Portal do Contribuinte (T16 · módulo 4).

  Função pura e testável (golden test em tests/parcelamento.test.ts).
  Valores 100% sintéticos — o mock não aplica juros/multa reais; a regra
  de negócio definitiva virá da legislação municipal quando o backend
  real existir. A única regra reproduzida: nenhuma parcela pode ficar
  abaixo do piso municipal (R$ 100,00), o que limita o nº de parcelas
  disponíveis para valores pequenos.
*/

export const PARCELA_MINIMA_BRL = 100;
export const MAX_PARCELAS = 12;

export type ParcelamentoSimulacao = {
  parcelas: number;
  /** Valor de cada parcela (as iniciais); a última absorve o resíduo de arredondamento. */
  valorParcela: number;
  /** Valor da última parcela — pode diferir por centavos. */
  valorUltimaParcela: number;
  valorTotal: number;
  primeiroVencimento: string;
  ultimoVencimento: string;
};

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Nº máximo de parcelas permitido para um valor, respeitando o piso por parcela. */
export function maxParcelasFor(valorTotal: number): number {
  if (valorTotal <= 0) return 1;
  const byFloor = Math.floor(valorTotal / PARCELA_MINIMA_BRL);
  return Math.min(MAX_PARCELAS, Math.max(1, byFloor));
}

/**
 * Simula um plano de parcelamento. `parcelas` é normalizado para o
 * intervalo válido (1..maxParcelasFor). A soma das parcelas fecha
 * exatamente o valor total (resíduo de arredondamento vai para a última).
 */
export function simulateParcelamento(
  valorTotal: number,
  parcelas: number,
  hoje: Date = new Date(),
): ParcelamentoSimulacao {
  const total = Math.max(0, Math.round(valorTotal * 100) / 100);
  const n = Math.min(Math.max(1, Math.trunc(parcelas)), maxParcelasFor(total));

  const centavosTotal = Math.round(total * 100);
  const centavosParcela = Math.floor(centavosTotal / n);
  const residuo = centavosTotal - centavosParcela * n;

  const valorParcela = centavosParcela / 100;
  const valorUltimaParcela = (centavosParcela + residuo) / 100;

  const primeiro = addMonths(hoje, 1);
  const ultimo = addMonths(hoje, n);

  return {
    parcelas: n,
    valorParcela,
    valorUltimaParcela,
    valorTotal: total,
    primeiroVencimento: toIsoDate(primeiro),
    ultimoVencimento: toIsoDate(ultimo),
  };
}
