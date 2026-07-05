import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api-client";
import { resolveErrorMessage } from "@/lib/errors";

/*
  T25 — Tratamento único de erro.
  Garante que a UI nunca precise ler `error.message` cru:
   · códigos catalogados retornam par pt-BR curado
   · códigos desconhecidos caem em fallback amigável por status
   · Error/unknown genéricos não vazam a message técnica
   · correlationId é preservado para telemetria
*/

describe("resolveErrorMessage", () => {
  it("mapeia códigos catalogados para mensagem pt-BR", () => {
    const err = new ApiError(403, "forbidden_role", "detalhe interno", "cid-1");
    const out = resolveErrorMessage(err);
    expect(out.title).toContain("não permitida");
    expect(out.description).not.toBe("detalhe interno");
    expect(out.description).toContain("perfil");
    expect(out.correlationId).toBe("cid-1");
    expect(out.code).toBe("forbidden_role");
  });

  it("mapeia invalid_decision_body sem vazar detalhe técnico", () => {
    const err = new ApiError(
      400,
      "invalid_decision_body",
      "ZodError: expected string got undefined",
      "cid-2",
    );
    const out = resolveErrorMessage(err);
    expect(out.title).toContain("decisão");
    expect(out.description).not.toContain("ZodError");
  });

  it("ApiError 5xx sem code conhecido vira mensagem de indisponibilidade", () => {
    const err = new ApiError(503, "UNKNOWN_ERROR", "", "cid-3");
    const out = resolveErrorMessage(err);
    expect(out.title).toContain("indisponível");
    expect(out.correlationId).toBe("cid-3");
  });

  it("ApiError 404 sem code conhecido vira mensagem de não encontrado", () => {
    const err = new ApiError(404, "UNKNOWN_ERROR", "", "cid-4");
    const out = resolveErrorMessage(err);
    expect(out.title.toLowerCase()).toContain("não encontrado");
  });

  it("ApiError 401/403 sem code conhecido vira mensagem de autorização", () => {
    const err = new ApiError(401, "UNKNOWN_ERROR", "", "cid-5");
    const out = resolveErrorMessage(err);
    expect(out.title.toLowerCase()).toContain("acesso");
  });

  it("Error genérico não vaza .message técnica", () => {
    const err = new Error("TypeError: Cannot read property 'foo' of undefined");
    const out = resolveErrorMessage(err);
    expect(out.description).not.toContain("TypeError");
    expect(out.title).toContain("Não foi possível");
  });

  it("erro de rede é reconhecido pelo texto", () => {
    const err = new TypeError("Failed to fetch");
    const out = resolveErrorMessage(err);
    expect(out.title.toLowerCase()).toContain("conexão");
  });

  it("valor desconhecido (não Error) vira mensagem inesperada", () => {
    const out = resolveErrorMessage({ weird: true });
    expect(out.title).toContain("inesperado");
  });
});
