import { describe, expect, it } from "vitest";

import {
  MAX_PARCELAS,
  PARCELA_MINIMA_BRL,
  maxParcelasFor,
  simulateParcelamento,
} from "@/lib/citizen/parcelamento";

/*
  T16 — golden tests do simulador de parcelamento (módulo 4).
  Regras: soma das parcelas fecha o total (resíduo na última),
  piso de R$ 100 por parcela limita o nº de parcelas, teto de 12.
*/

describe("maxParcelasFor", () => {
  it("limita a 12 parcelas para valores altos", () => {
    expect(maxParcelasFor(1_000_000)).toBe(MAX_PARCELAS);
  });

  it("respeita o piso por parcela em valores pequenos", () => {
    // R$ 450 / R$ 100 → no máximo 4 parcelas
    expect(maxParcelasFor(450)).toBe(4);
  });

  it("retorna ao menos 1 parcela mesmo abaixo do piso", () => {
    expect(maxParcelasFor(80)).toBe(1);
    expect(maxParcelasFor(0)).toBe(1);
  });
});

describe("simulateParcelamento", () => {
  const hoje = new Date("2026-07-05T12:00:00Z");

  it("divide o valor igualmente quando não há resíduo", () => {
    const sim = simulateParcelamento(22_800, 6, hoje);
    expect(sim.parcelas).toBe(6);
    expect(sim.valorParcela).toBe(3_800);
    expect(sim.valorUltimaParcela).toBe(3_800);
    expect(sim.valorTotal).toBe(22_800);
  });

  it("a soma das parcelas fecha exatamente o total (resíduo na última)", () => {
    const sim = simulateParcelamento(100, 3, hoje);
    const soma = sim.valorParcela * (sim.parcelas - 1) + sim.valorUltimaParcela;
    expect(Math.round(soma * 100)).toBe(100 * 100);
    expect(sim.valorUltimaParcela).toBeGreaterThanOrEqual(sim.valorParcela);
  });

  it("normaliza pedidos acima do máximo permitido", () => {
    // R$ 450 comporta no máximo 4 parcelas de R$ 100+
    const sim = simulateParcelamento(450, 12, hoje);
    expect(sim.parcelas).toBe(4);
    expect(sim.valorParcela).toBeGreaterThanOrEqual(PARCELA_MINIMA_BRL);
  });

  it("normaliza pedidos abaixo de 1 parcela", () => {
    const sim = simulateParcelamento(1_000, 0, hoje);
    expect(sim.parcelas).toBe(1);
    expect(sim.valorParcela).toBe(1_000);
  });

  it("gera vencimentos mensais a partir do mês seguinte", () => {
    const sim = simulateParcelamento(1_200, 3, hoje);
    expect(sim.primeiroVencimento).toBe("2026-08-05");
    expect(sim.ultimoVencimento).toBe("2026-10-05");
  });
});
