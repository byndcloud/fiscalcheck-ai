import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { StatusCaso } from "@fiscalcheck/shared-types";

import { StatusBadge } from "@/components/ui/status-badge";

const STATUSES_ESPERADOS: Array<[StatusCaso, string]> = [
  ["candidato", "Candidato"],
  ["em_analise", "Em análise"],
  ["aguardando_aprovacao", "Aguardando aprovação"],
  ["notificado", "Notificado"],
  ["em_autorregularizacao", "Em autorregularização"],
  ["fiscalizacao", "Fiscalização"],
  ["encerrado", "Encerrado"],
];

describe("StatusBadge — cobertura dos 7 estados (T13)", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(STATUSES_ESPERADOS)("renderiza status %s com label pt-BR '%s'", (status, label) => {
    render(<StatusBadge kind="status" status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("resolve tone semântico para cada status (nunca undefined)", () => {
    const tonesEsperados: Record<StatusCaso, string> = {
      candidato: "info",
      em_analise: "risk-3",
      aguardando_aprovacao: "risk-4",
      notificado: "risk-3",
      em_autorregularizacao: "risk-2",
      fiscalizacao: "risk-5",
      encerrado: "neutral",
    };
    for (const [status] of STATUSES_ESPERADOS) {
      const { container, unmount } = render(<StatusBadge kind="status" status={status} />);
      const badge = container.querySelector<HTMLElement>('[data-slot="status-badge"]');
      expect(badge?.dataset.tone).toBe(tonesEsperados[status]);
      unmount();
    }
  });
});
