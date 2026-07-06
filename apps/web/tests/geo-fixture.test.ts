import { describe, expect, it } from "vitest";

import { GeoObraSchema } from "@fiscalcheck/shared-types";

import { casosFixture } from "@/mocks/fixtures/casos";
import { contribuintesFixture } from "@/mocks/fixtures/contribuintes";
import { geoObrasFixture } from "@/mocks/fixtures/geo-obras";

/*
  T21 — integridade da fixture de geofiscalização:
  - aceite pede 10–15 pins mock;
  - coordenadas normalizadas (nunca lat/long real — AGENTS.md §1.2);
  - referências cruzadas apontam para contribuintes e casos que existem
    (senão o popup e o deep-link /cases?caso= quebram em silêncio).
*/

describe("Geofiscalização — fixture (T21)", () => {
  it("tem entre 10 e 15 pins, todos válidos contra o schema", () => {
    expect(geoObrasFixture.length).toBeGreaterThanOrEqual(10);
    expect(geoObrasFixture.length).toBeLessThanOrEqual(15);

    for (const obra of geoObrasFixture) {
      expect(GeoObraSchema.safeParse(obra).success).toBe(true);
    }
  });

  it("usa coordenadas normalizadas dentro do mapa estilizado", () => {
    for (const obra of geoObrasFixture) {
      expect(obra.x).toBeGreaterThanOrEqual(0);
      expect(obra.x).toBeLessThanOrEqual(100);
      expect(obra.y).toBeGreaterThanOrEqual(0);
      expect(obra.y).toBeLessThanOrEqual(100);
    }
  });

  it("todo pin referencia um contribuinte existente (dados do popup)", () => {
    const taxpayerIds = new Set(contribuintesFixture.map((c) => c.id));
    for (const obra of geoObrasFixture) {
      expect(taxpayerIds.has(obra.contribuinteId)).toBe(true);
    }
  });

  it("pins com caso aberto apontam para caso real do mesmo contribuinte", () => {
    const casoById = new Map(casosFixture.map((c) => [c.id, c]));
    const comCaso = geoObrasFixture.filter((o) => o.status === "caso_aberto");
    expect(comCaso.length).toBeGreaterThanOrEqual(1);

    for (const obra of comCaso) {
      expect(obra.casoId).toBeDefined();
      const caso = obra.casoId ? casoById.get(obra.casoId) : undefined;
      expect(caso).toBeDefined();
      expect(caso?.contribuinteId).toBe(obra.contribuinteId);
    }
  });

  it("cobre mais de um bairro e mais de um tipo (filtros do aceite)", () => {
    expect(new Set(geoObrasFixture.map((o) => o.bairro)).size).toBeGreaterThan(1);
    expect(new Set(geoObrasFixture.map((o) => o.tipo)).size).toBeGreaterThan(1);
  });
});
