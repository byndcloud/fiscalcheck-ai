import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Score } from "@fiscalcheck/shared-types";

import { ScoreFactorsPanel } from "@/components/risk/score-factors-panel";

/*
  T09 — painel "Por que este score?" (RF03):
  - fatores ordenados por |contribuição| desc;
  - sinal correto (+pts aumenta risco / −pts reduz);
  - nota de defensabilidade e versão do modelo sempre presentes.
*/

const score: Score = {
  contribuinteId: "ct-001",
  valor: 82,
  nivel: "alto",
  calculadoEm: "2026-07-02T06:30:00Z",
  modeloVersao: "risk-model-v2.4",
  fatores: [
    {
      nome: "Fator menor",
      peso: 0.1,
      contribuicao: 5,
      evidencia: "Evidência menor.",
      origem: "cadastro",
    },
    {
      nome: "Fator dominante",
      peso: 0.4,
      contribuicao: 33,
      evidencia: "Evidência dominante.",
      origem: "cruzamento",
    },
    {
      nome: "Fator mitigador",
      peso: 0.2,
      contribuicao: -10,
      evidencia: "Evidência mitigadora.",
      origem: "historico",
    },
  ],
};

describe("ScoreFactorsPanel", () => {
  afterEach(() => cleanup());

  it("ordena os fatores por magnitude de contribuição", () => {
    render(<ScoreFactorsPanel score={score} />);
    const itens = screen.getAllByRole("listitem");
    expect(within(itens[0] as HTMLElement).getByText("Fator dominante")).toBeInTheDocument();
    expect(within(itens[1] as HTMLElement).getByText("Fator mitigador")).toBeInTheDocument();
    expect(within(itens[2] as HTMLElement).getByText("Fator menor")).toBeInTheDocument();
  });

  it("exibe o sinal correto de cada contribuição", () => {
    render(<ScoreFactorsPanel score={score} />);
    expect(screen.getByText("+33 pts")).toBeInTheDocument();
    expect(screen.getByText("−10 pts")).toBeInTheDocument();
    expect(screen.getByText("+5 pts")).toBeInTheDocument();
  });

  it("descreve as barras para leitores de tela", () => {
    render(<ScoreFactorsPanel score={score} />);
    expect(
      screen.getByRole("img", { name: /Fator dominante: aumenta o risco em 33 pontos/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Fator mitigador: reduz o risco em 10 pontos/ }),
    ).toBeInTheDocument();
  });

  it("mostra a nota de defensabilidade e a versão do modelo", () => {
    render(<ScoreFactorsPanel score={score} />);
    expect(
      screen.getByText(/registrada para defesa perante órgãos de controle/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/risk-model-v2\.4/)).toBeInTheDocument();
  });

  it("exibe o valor e o nível do score no cabeçalho", () => {
    render(<ScoreFactorsPanel score={score} />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("Risco alto")).toBeInTheDocument();
  });
});
