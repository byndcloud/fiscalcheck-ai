"use client";

import { AlertTriangleIcon, ArrowRightIcon, InfoIcon, WavesIcon } from "lucide-react";

import type { Contribuinte, NivelRisco } from "@fiscalcheck/shared-types";

import { StatusBadge } from "@/components/ui/status-badge";
import type { SimulationSummary } from "@/lib/risk-model/simulate";
import { cn } from "@/lib/utils";

/*
  Preview do impacto do modelo (T02 · módulo 3).
  - Mostra "N casos mudariam de faixa" — critério de aceite direto.
  - Distribuição antes/depois em barra empilhada.
  - Lista dos casos que efetivamente mudam, com |Δ| ordenado.
  - Estados vazio/erro tratados no wrapper (a página principal decide
    quando renderizar este componente).
*/

type RiskModelPreviewProps = {
  summary: SimulationSummary;
  taxpayerById: Map<string, Contribuinte>;
  hasDraftChanges: boolean;
};

const LEVEL_ORDER: readonly NivelRisco[] = ["conforme", "baixo", "medio", "alto", "critico"];

const LEVEL_LABEL: Record<NivelRisco, string> = {
  conforme: "Conforme",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

const LEVEL_TONE: Record<NivelRisco, string> = {
  conforme: "bg-risk-1",
  baixo: "bg-risk-2",
  medio: "bg-risk-3",
  alto: "bg-risk-4",
  critico: "bg-risk-5",
};

export function RiskModelPreview({
  summary,
  taxpayerById,
  hasDraftChanges,
}: RiskModelPreviewProps) {
  return (
    <section
      aria-label="Preview do impacto do modelo na fila"
      className="grid gap-5 rounded-[var(--r-lg)] border border-border bg-surface p-6 shadow-[var(--e-1)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-[15px] font-bold text-text-strong">Preview do impacto</h2>
          <p className="text-xs text-muted-foreground">
            Simulação sobre {summary.total} casos da fila atual. Os cálculos são atualizados a cada
            ajuste; nada é publicado até a confirmação.
          </p>
        </div>
      </header>

      <ImpactHero
        levelChangedCount={summary.levelChangedCount}
        total={summary.total}
        hasDraftChanges={hasDraftChanges}
      />

      <DistributionCompare summary={summary} />

      <MovedList summary={summary} taxpayerById={taxpayerById} />
    </section>
  );
}

function ImpactHero({
  levelChangedCount,
  total,
  hasDraftChanges,
}: {
  levelChangedCount: number;
  total: number;
  hasDraftChanges: boolean;
}) {
  const hasImpact = levelChangedCount > 0;

  return (
    <output
      className={cn(
        "grid gap-2 rounded-[var(--r-md)] border p-4",
        !hasDraftChanges
          ? "border-border/60 bg-n-25"
          : hasImpact
            ? "border-[color-mix(in_srgb,var(--c-risk-4)_35%,transparent)] bg-[color-mix(in_srgb,var(--c-risk-4)_8%,var(--surface))]"
            : "border-[color-mix(in_srgb,var(--c-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--c-success)_8%,var(--surface))]",
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {!hasDraftChanges ? (
          <InfoIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        ) : hasImpact ? (
          <AlertTriangleIcon
            aria-hidden="true"
            className="size-4 text-[color:var(--c-risk-4-txt)]"
          />
        ) : (
          <WavesIcon aria-hidden="true" className="size-4 text-[color:var(--c-risk-1-txt)]" />
        )}
        <p className="text-[13px] font-semibold text-text-strong">
          {!hasDraftChanges
            ? "Configuração idêntica à publicada"
            : hasImpact
              ? `${levelChangedCount} de ${total} casos mudariam de faixa`
              : "Nenhum caso mudaria de faixa"}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {!hasDraftChanges
          ? "Ajuste um peso, faixa ou regra para ver o preview do impacto na fila."
          : hasImpact
            ? "Revise a lista abaixo antes de publicar. A reordenação da fila de risco só é aplicada após a confirmação."
            : "Ajustes atuais apenas suavizam a pontuação — nenhum caso troca de nível na fila."}
      </p>
    </output>
  );
}

function DistributionCompare({ summary }: { summary: SimulationSummary }) {
  return (
    <div className="grid gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
        Distribuição por nível
      </p>
      <div className="grid gap-2">
        <DistributionRow label="Antes" totals={summary.distributionBefore} total={summary.total} />
        <DistributionRow label="Depois" totals={summary.distributionAfter} total={summary.total} />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {LEVEL_ORDER.map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2 rounded-full", LEVEL_TONE[level])} />
            {LEVEL_LABEL[level]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DistributionRow({
  label,
  totals,
  total,
}: {
  label: string;
  totals: Record<NivelRisco, number>;
  total: number;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-3">
      <span className="font-data text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-n-100">
        {LEVEL_ORDER.map((level) => {
          const count = totals[level];
          if (count === 0 || total === 0) return null;
          const pct = (count / total) * 100;
          return (
            <span
              key={level}
              className={cn("h-full", LEVEL_TONE[level])}
              style={{ width: `${pct}%` }}
              title={`${LEVEL_LABEL[level]}: ${count}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function MovedList({
  summary,
  taxpayerById,
}: {
  summary: SimulationSummary;
  taxpayerById: Map<string, Contribuinte>;
}) {
  if (summary.moved.length === 0) {
    return (
      <div className="rounded-[var(--r-md)] border border-dashed border-border/70 bg-n-25/40 p-4 text-xs text-muted-foreground">
        Sem casos migrando de faixa neste rascunho.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
        Casos que trocam de faixa
      </p>
      <ul className="grid gap-2">
        {summary.moved.map((item) => {
          const tp = taxpayerById.get(item.contribuinteId);
          const positive = item.delta > 0;
          return (
            <li
              key={item.contribuinteId}
              className="grid gap-2 rounded-[var(--r-md)] border border-border/60 bg-n-25/40 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="grid gap-0.5">
                <p className="text-[13px] font-semibold text-text-strong">
                  {tp?.razaoSocial ?? "Contribuinte sem nome cadastrado"}
                </p>
                <p className="font-data text-[11px] text-text-muted">
                  {item.contribuinteId}
                  {tp?.inscricaoMunicipal ? ` · ${tp.inscricaoMunicipal}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind="risk" level={item.originalLevel} />
                <ArrowRightIcon aria-hidden="true" className="size-3.5 text-text-muted" />
                <StatusBadge kind="risk" level={item.simulatedLevel} />
                <span className="font-data text-[11px] text-text-muted">
                  <span className="font-semibold text-text-strong">{item.simulatedValue}</span>
                  <span aria-hidden="true"> / </span>
                  <span>{item.originalValue}</span>
                  <span
                    className={cn("ml-1 font-semibold", positive ? "text-risk-4" : "text-risk-2")}
                  >
                    ({positive ? "+" : ""}
                    {item.delta})
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
