import { describe, expect, it } from "vitest";

import type { RecomendacaoAcao, StatusCaso } from "@fiscalcheck/shared-types";

import { nextStatus, shouldEmitDocument } from "@/lib/case-transitions";

/*
  Bateria da máquina de transição do módulo 4 (T13). Cobre os 7 estados
  × 3 ações — mais os casos especiais dependentes de recomendação.
*/

const RECOMMENDATION_EXPECTATIONS: Array<[RecomendacaoAcao, StatusCaso]> = [
  ["intimacao", "notificado"],
  ["autorregularizacao", "em_autorregularizacao"],
  ["fiscalizacao", "fiscalizacao"],
];

describe("nextStatus — máquina de transição de casos", () => {
  it("aprovar em candidato leva a em_analise", () => {
    expect(nextStatus({ statusAtual: "candidato", action: "aprovar" })).toBe("em_analise");
  });

  it("aprovar em em_analise leva a aguardando_aprovacao", () => {
    expect(nextStatus({ statusAtual: "em_analise", action: "aprovar" })).toBe(
      "aguardando_aprovacao",
    );
  });

  it.each(RECOMMENDATION_EXPECTATIONS)(
    "aprovar em aguardando_aprovacao com recomendação %s → %s",
    (recomendacao, esperado) => {
      expect(
        nextStatus({
          statusAtual: "aguardando_aprovacao",
          action: "aprovar",
          recomendacao,
        }),
      ).toBe(esperado);
    },
  );

  it("aprovar em aguardando_aprovacao sem recomendação é inválido", () => {
    expect(nextStatus({ statusAtual: "aguardando_aprovacao", action: "aprovar" })).toBeNull();
  });

  it("rejeitar em em_analise encerra o caso", () => {
    expect(nextStatus({ statusAtual: "em_analise", action: "rejeitar" })).toBe("encerrado");
  });

  it("rejeitar em aguardando_aprovacao volta para em_analise", () => {
    expect(nextStatus({ statusAtual: "aguardando_aprovacao", action: "rejeitar" })).toBe(
      "em_analise",
    );
  });

  it("rejeitar em notificado escala para fiscalização", () => {
    expect(nextStatus({ statusAtual: "notificado", action: "rejeitar" })).toBe("fiscalizacao");
  });

  it("aprovar em em_autorregularizacao encerra", () => {
    expect(nextStatus({ statusAtual: "em_autorregularizacao", action: "aprovar" })).toBe(
      "encerrado",
    );
  });

  it("aprovar em fiscalizacao encerra", () => {
    expect(nextStatus({ statusAtual: "fiscalizacao", action: "aprovar" })).toBe("encerrado");
  });

  it("ajustar mantém o status atual em qualquer fase", () => {
    const estados: StatusCaso[] = [
      "candidato",
      "em_analise",
      "aguardando_aprovacao",
      "notificado",
      "em_autorregularizacao",
      "fiscalizacao",
    ];
    for (const estado of estados) {
      expect(nextStatus({ statusAtual: estado, action: "ajustar" })).toBe(estado);
    }
  });

  it("caso encerrado não aceita novas transições", () => {
    expect(nextStatus({ statusAtual: "encerrado", action: "aprovar" })).toBeNull();
    expect(nextStatus({ statusAtual: "encerrado", action: "rejeitar" })).toBeNull();
  });
});

describe("shouldEmitDocument — emissão de termos", () => {
  it("aprovar recomendação de intimação emite termo de intimação", () => {
    expect(shouldEmitDocument("aguardando_aprovacao", "aprovar", "intimacao")).toBe(
      "termo_intimacao",
    );
  });

  it("aprovar recomendação de fiscalização emite termo de início de fiscalização", () => {
    expect(shouldEmitDocument("aguardando_aprovacao", "aprovar", "fiscalizacao")).toBe(
      "termo_inicio_fiscalizacao",
    );
  });

  it("autorregularização não emite termo formal", () => {
    expect(shouldEmitDocument("aguardando_aprovacao", "aprovar", "autorregularizacao")).toBeNull();
  });

  it("aprovações fora de aguardando_aprovacao não emitem termo", () => {
    expect(shouldEmitDocument("em_analise", "aprovar", "intimacao")).toBeNull();
    expect(shouldEmitDocument("notificado", "aprovar", "fiscalizacao")).toBeNull();
  });

  it("rejeições nunca emitem termo", () => {
    expect(shouldEmitDocument("aguardando_aprovacao", "rejeitar", "intimacao")).toBeNull();
  });
});
