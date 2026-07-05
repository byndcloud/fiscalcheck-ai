import { ShieldCheckIcon } from "lucide-react";

import type { FatorRisco, Score } from "@fiscalcheck/shared-types";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

/*
  Painel "Por que este score?" (T09 · módulo 3 · RF03).

  Explicabilidade defensável perante órgãos de controle:
  - fatores ordenados por magnitude de contribuição (|pts| desc);
  - barra proporcional no espectro de risco (regra do DS §2.2 — o
    espectro é exclusivo da semântica de score): fator que AUMENTA o
    risco usa risk-4, fator que REDUZ usa risk-1;
  - evidência e origem de cada fator preservadas para a cadeia de
    custódia;
  - rodapé fixo com a nota de registro para defesa + versão do modelo,
    garantindo reprodutibilidade (modeloVersao + calculadoEm).

  Reaproveitado no Dossiê (T13), na tabela Risco & IA e no PDF (T28).
*/

const ORIGEM_LABEL: Record<FatorRisco["origem"], string> = {
  cruzamento: "Cruzamento de dados",
  grafo: "Rede societária",
  cadastro: "Cadastro mobiliário",
  historico: "Histórico fiscal",
};

function sortedFactors(fatores: FatorRisco[]): FatorRisco[] {
  return [...fatores].sort((a, b) => Math.abs(b.contribuicao) - Math.abs(a.contribuicao));
}

function formatPts(contribuicao: number): string {
  const rounded = Math.round(contribuicao * 10) / 10;
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)} pts`;
}

type Props = {
  score: Score;
  className?: string;
};

export function ScoreFactorsPanel({ score, className }: Props) {
  const fatores = sortedFactors(score.fatores);
  const maxAbs = Math.max(...fatores.map((f) => Math.abs(f.contribuicao)), 1);

  return (
    <section
      aria-label="Por que este score?"
      className={cn(
        "rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]",
        className,
      )}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Por que este score?
        </h4>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-text-strong">
            {score.valor}
            <span className="text-xs font-normal text-muted-foreground"> / 100</span>
          </span>
          <StatusBadge kind="risk" level={score.nivel} />
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {fatores.map((fator) => {
          const aumentaRisco = fator.contribuicao >= 0;
          const widthPct = Math.max(6, Math.round((Math.abs(fator.contribuicao) / maxAbs) * 100));
          return (
            <li key={fator.nome} className="grid gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm text-text-strong">{fator.nome}</span>
                <span
                  className={cn(
                    "font-data text-xs font-semibold",
                    aumentaRisco ? "text-risk-4" : "text-risk-1",
                  )}
                >
                  {formatPts(fator.contribuicao)}
                </span>
              </div>
              {/* Barra de contribuição — largura proporcional ao |pts| do maior fator */}
              <div
                role="img"
                aria-label={`${fator.nome}: ${aumentaRisco ? "aumenta" : "reduz"} o risco em ${Math.abs(fator.contribuicao)} pontos`}
                className="h-2 w-full overflow-hidden rounded-pill bg-n-50"
              >
                <div
                  className={cn("h-full rounded-pill", aumentaRisco ? "bg-risk-4" : "bg-risk-1")}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="mr-1.5 rounded-full border border-border bg-n-25 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-foreground">
                  {ORIGEM_LABEL[fator.origem]}
                </span>
                {fator.evidencia}
              </p>
            </li>
          );
        })}
      </ol>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheckIcon aria-hidden className="size-3.5 shrink-0 text-brand" />
          Explicabilidade registrada para defesa perante órgãos de controle.
        </p>
        <p className="font-data text-[10px] text-muted-foreground">
          {score.modeloVersao} · {new Date(score.calculadoEm).toLocaleString("pt-BR")}
        </p>
      </footer>
    </section>
  );
}
