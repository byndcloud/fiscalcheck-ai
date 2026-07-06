import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Contribuinte, GeoObra } from "@fiscalcheck/shared-types";

import { GeoMap } from "@/components/geo/geo-map";
import { contribuintesFixture } from "@/mocks/fixtures/contribuintes";
import { geoObrasFixture } from "@/mocks/fixtures/geo-obras";

/*
  T21 — aceite da tela: mapa carrega com os pins mock; clicar no pin
  abre o popup com dados do contribuinte e navega ao caso (link
  /cases?caso=…) ou oferece "gerar caso" quando ainda não há caso.
*/

const taxpayerById = new Map<string, Contribuinte>(contribuintesFixture.map((c) => [c.id, c]));

function renderMap(overrides?: Partial<Parameters<typeof GeoMap>[0]>) {
  const onSelect = vi.fn();
  const onOpenCase = vi.fn();
  render(
    <GeoMap
      obras={geoObrasFixture}
      taxpayerById={taxpayerById}
      selectedId={null}
      onSelect={onSelect}
      onOpenCase={onOpenCase}
      {...overrides}
    />,
  );
  return { onSelect, onOpenCase };
}

describe("GeoMap (T21)", () => {
  it("carrega o mapa com todos os pins mock (aceite: 10–15 pins)", () => {
    renderMap();
    for (const obra of geoObrasFixture) {
      expect(screen.getByTestId(`geo-pin-${obra.id}`)).toBeInTheDocument();
    }
  });

  it("clicar num pin seleciona a obra (abre popup)", () => {
    const { onSelect } = renderMap();
    const alvo = geoObrasFixture[0] as GeoObra;

    fireEvent.click(screen.getByTestId(`geo-pin-${alvo.id}`));
    expect(onSelect).toHaveBeenCalledWith(alvo);
  });

  it("pin também responde a teclado (Enter) — WCAG", () => {
    const { onSelect } = renderMap();
    const alvo = geoObrasFixture[0] as GeoObra;

    fireEvent.keyDown(screen.getByTestId(`geo-pin-${alvo.id}`), { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(alvo);
  });

  it("popup de obra com caso aberto mostra o contribuinte e navega ao caso", () => {
    const comCaso = geoObrasFixture.find((o) => o.status === "caso_aberto") as GeoObra;
    renderMap({ selectedId: comCaso.id });

    const popup = screen.getByTestId("geo-popup");
    expect(popup).toBeInTheDocument();

    // Dados do contribuinte (razão social vem da fixture de contribuintes).
    const taxpayer = taxpayerById.get(comCaso.contribuinteId) as Contribuinte;
    expect(screen.getByText(taxpayer.razaoSocial)).toBeInTheDocument();

    // Aceite: clicar no pin navega ao caso — deep-link da fila T13.
    const link = screen.getByRole("link", {
      name: new RegExp(`Ver caso ${comCaso.casoId}`, "i"),
    });
    expect(link).toHaveAttribute("href", `/cases?caso=${comCaso.casoId}`);
  });

  it("popup de obra sem caso oferece a ação 'Gerar caso na fila'", () => {
    const semCaso = geoObrasFixture.find((o) => o.status === "novo") as GeoObra;
    const { onOpenCase } = renderMap({ selectedId: semCaso.id });

    fireEvent.click(screen.getByRole("button", { name: "Gerar caso na fila" }));
    expect(onOpenCase).toHaveBeenCalledWith(semCaso);
  });
});
