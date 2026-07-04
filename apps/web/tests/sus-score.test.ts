import { describe, expect, it } from "vitest";

import { computeSusMedia, computeSusScore } from "@/lib/analytics/sus";

/*
  Bateria da fórmula SUS (Brooke, 1996) — T17 · módulo 5.
  Casos-borda cobrem 0/68/100 e validam a inversão de itens pares.
*/

describe("computeSusScore — regra de Brooke", () => {
  it("respostas mínimas (piores possíveis) → score 0", () => {
    // ímpares = 1 (contrib = 0); pares = 5 (contrib = 0). Soma = 0.
    const respostas = [1, 5, 1, 5, 1, 5, 1, 5, 1, 5];
    expect(computeSusScore(respostas)).toBe(0);
  });

  it("respostas máximas (melhores possíveis) → score 100", () => {
    // ímpares = 5 (contrib = 4); pares = 1 (contrib = 4). Soma = 40. * 2.5 = 100.
    const respostas = [5, 1, 5, 1, 5, 1, 5, 1, 5, 1];
    expect(computeSusScore(respostas)).toBe(100);
  });

  it("respostas médias 3 → score 50", () => {
    // ímpares = 3 (contrib = 2); pares = 3 (contrib = 2). Soma = 20. * 2.5 = 50.
    const respostas = Array.from({ length: 10 }, () => 3);
    expect(computeSusScore(respostas)).toBe(50);
  });

  it("respostas mistas 4/2 → score 75 (limiar 'aceitável' > 68)", () => {
    // ímpares = 4 (contrib = 3); pares = 2 (contrib = 3). Soma = 30. * 2.5 = 75.
    const respostas = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2];
    const score = computeSusScore(respostas);
    expect(score).toBe(75);
    expect(score).toBeGreaterThanOrEqual(68);
  });

  it("lança quando o tamanho é diferente de 10", () => {
    expect(() => computeSusScore([1, 2, 3])).toThrow(/10 respostas/);
  });

  it("lança quando a resposta está fora do intervalo 1..5", () => {
    const respostas = [1, 6, 3, 3, 3, 3, 3, 3, 3, 3];
    expect(() => computeSusScore(respostas)).toThrow(/1\.\.5/);
  });

  it("lança quando a resposta não é inteira", () => {
    const respostas = [1, 2, 3, 3, 3, 3, 3, 3, 3, 3.5];
    expect(() => computeSusScore(respostas)).toThrow(/1\.\.5/);
  });
});

describe("computeSusMedia — agregado", () => {
  it("média aritmética simples arredondada a 1 casa", () => {
    expect(computeSusMedia([70, 80, 90])).toBe(80);
    expect(computeSusMedia([75, 87, 65])).toBe(75.7);
  });

  it("array vazio → 0", () => {
    expect(computeSusMedia([])).toBe(0);
  });
});
