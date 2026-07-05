import { describe, expect, it } from "vitest";

import type { Divergencia } from "@fiscalcheck/shared-types";

import { explainDivergencia, summarizeValor } from "@/lib/citizen/plain-language";

/*
  T16 — linguagem clara do cidadão: todo tipo de divergência tem
  explicação sem jargão fiscal e com orientação de próximo passo.
*/

function makeDivergencia(tipo: Divergencia["tipo"], valor: number | null = null): Divergencia {
  return {
    id: "dv-test",
    contribuinteId: "ct-test",
    tipo,
    origem: "declarado_vs_nfse",
    severidade: 3,
    valor,
    descricao: "Descrição técnica interna.",
    detectadoEm: "2026-07-01T00:00:00Z",
    evidencias: [],
  };
}

const TIPOS: Divergencia["tipo"][] = [
  "subdeclaracao",
  "omissao",
  "regime_incorreto",
  "endereco_inconsistente",
  "socio_vinculado",
];

describe("explainDivergencia", () => {
  it.each(TIPOS)("tem título, explicação e orientação para %s", (tipo) => {
    const plain = explainDivergencia(makeDivergencia(tipo));
    expect(plain.titulo.length).toBeGreaterThan(10);
    expect(plain.explicacao.length).toBeGreaterThan(30);
    expect(plain.oQueFazer.length).toBeGreaterThan(20);
  });

  it("não usa siglas fiscais sem explicação", () => {
    for (const tipo of TIPOS) {
      const plain = explainDivergencia(makeDivergencia(tipo));
      const texto = `${plain.titulo} ${plain.explicacao} ${plain.oQueFazer}`;
      // Jargões proibidos na comunicação com o cidadão (skill frontend §3).
      expect(texto).not.toMatch(/PGDAS|DIMP|ECD|NFS-e|CTN/);
    }
  });
});

describe("summarizeValor", () => {
  it("formata o valor em BRL quando presente", () => {
    const resumo = summarizeValor(makeDivergencia("subdeclaracao", 12_300));
    expect(resumo).toContain("12.300");
    expect(resumo).toContain("R$");
  });

  it("retorna null quando não há valor", () => {
    expect(summarizeValor(makeDivergencia("socio_vinculado", null))).toBeNull();
  });
});
