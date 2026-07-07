import { describe, expect, it } from "vitest";

import { DivergenciaSchema, NFSeSchema } from "@fiscalcheck/shared-types";
import { z } from "zod";

import { casosFixture } from "@/mocks/fixtures/casos";
import { divergenciasFixture } from "@/mocks/fixtures/divergencias";
import { nfseFixture } from "@/mocks/fixtures/nfse";

/*
  T05 — invariantes das fixtures do cruzamento ("caso instruído e
  auditável, não alerta estatístico"):
  1. todo divergenciaId referenciado por um caso existe;
  2. divergências monetárias fecham a conta apurado − declarado = valor;
  3. evidências NFS-e existem e SOMAM o valor apurado da divergência.
*/

describe("Fixtures do cruzamento (T05)", () => {
  it("valida contra os schemas compartilhados", () => {
    expect(() => z.array(DivergenciaSchema).parse(divergenciasFixture)).not.toThrow();
    expect(() => z.array(NFSeSchema).parse(nfseFixture)).not.toThrow();
  });

  it("nenhum caso referencia divergência inexistente (link para o dossiê nunca quebra)", () => {
    const ids = new Set(divergenciasFixture.map((d) => d.id));
    for (const caso of casosFixture) {
      for (const dvId of caso.divergenciaIds) {
        expect(ids.has(dvId), `caso ${caso.id} referencia ${dvId} inexistente`).toBe(true);
      }
    }
  });

  it("cálculo da diferença fecha: valorApurado − valorDeclarado = valor", () => {
    const monetarias = divergenciasFixture.filter(
      (d) => d.valorDeclarado !== undefined && d.valorApurado !== undefined,
    );
    expect(monetarias.length).toBeGreaterThan(10);
    for (const d of monetarias) {
      const diferenca = (d.valorApurado ?? 0) - (d.valorDeclarado ?? 0);
      expect(Math.abs(diferenca - (d.valor ?? 0)), `diferença não fecha em ${d.id}`).toBeLessThan(
        0.01,
      );
    }
  });

  it("há cenário DIMP × declarado demonstrável (RF 3.1.1 — meios de pagamento)", () => {
    const dimp = divergenciasFixture.filter((d) => d.origem === "dimp_vs_declarado");
    expect(dimp.length).toBeGreaterThanOrEqual(2);

    for (const d of dimp) {
      // Monetária por definição: o cruzamento é cartões × declarado.
      expect(d.valorApurado, `divergência DIMP ${d.id} sem valor apurado`).toBeDefined();
      // A evidência aponta para a carga DIMP do painel de ingestão (módulo 1).
      expect(
        d.evidencias.some((ev) => ev.startsWith("arq-")),
        `divergência DIMP ${d.id} sem evidência de arquivo de carga`,
      ).toBe(true);
    }
  });

  it("evidências NFS-e existem e somam o valor apurado", () => {
    const nfseById = new Map(nfseFixture.map((n) => [n.id, n]));
    const comEvidenciaFiscal = divergenciasFixture.filter(
      (d) => d.origem === "declarado_vs_nfse" && d.valorApurado !== undefined,
    );
    expect(comEvidenciaFiscal.length).toBeGreaterThan(10);

    for (const d of comEvidenciaFiscal) {
      const notas = d.evidencias.filter((ev) => ev.startsWith("nf-")).map((ev) => nfseById.get(ev));
      expect(notas.every(Boolean), `evidência NFS-e ausente em ${d.id}`).toBe(true);

      const soma = notas.reduce((acc, n) => acc + (n?.valorServicos ?? 0), 0);
      expect(
        Math.abs(soma - (d.valorApurado ?? 0)),
        `NFS-e de ${d.id} somam ${soma}, esperado ${d.valorApurado}`,
      ).toBeLessThan(0.01);
    }
  });
});
