"use client";

import type {
  NivelRisco,
  RegimeTributario,
  RiskQueueItem,
  TipoDivergencia,
} from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Segmentação da carteira (T08 · módulo 3 · RF03/FA03).
  Visão macro por nível de risco, porte/regime e tipo de inconsistência.
  Cada chip é um toggle de filtro (aria-pressed) — o estado vive na
  página; este componente é totalmente controlado via props.
*/

const NIVEL_ORDER: NivelRisco[] = ["critico", "alto", "medio", "baixo", "conforme"];

const NIVEL_LABEL: Record<NivelRisco, string> = {
  conforme: "Conforme",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

const NIVEL_DOT_VAR: Record<NivelRisco, string> = {
  conforme: "var(--c-risk-1)",
  baixo: "var(--c-risk-2)",
  medio: "var(--c-risk-3)",
  alto: "var(--c-risk-4)",
  critico: "var(--c-risk-5)",
};

const REGIME_ORDER: RegimeTributario[] = [
  "simples_nacional",
  "lucro_presumido",
  "lucro_real",
  "mei",
];

const REGIME_LABEL: Record<RegimeTributario, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
};

const TIPO_ORDER: TipoDivergencia[] = [
  "subdeclaracao",
  "omissao",
  "regime_incorreto",
  "endereco_inconsistente",
  "socio_vinculado",
  "inativo_atividade",
];

const TIPO_LABEL: Record<TipoDivergencia, string> = {
  subdeclaracao: "Subdeclaração",
  omissao: "Omissão",
  regime_incorreto: "Regime incorreto",
  endereco_inconsistente: "Endereço inconsistente",
  socio_vinculado: "Sócio vinculado",
  inativo_atividade: "Inativo com atividade",
};

// Abrevia cifras nos chips ("R$ 700 mil") — a tabela mantém o valor exato.
const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const CHIP_BASE_CLASSES = cn(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2",
);

const CHIP_ACTIVE_CLASSES = "border-brand bg-brand-050 text-brand-deep";
const CHIP_INACTIVE_CLASSES =
  "border-border bg-surface text-foreground hover:border-brand-100 hover:bg-n-25";

type RiskSegmentationPanelProps = {
  items: RiskQueueItem[];
  activeNiveis: NivelRisco[];
  activeRegimes: RegimeTributario[];
  activeTipos: TipoDivergencia[];
  onToggleNivel: (nivel: NivelRisco) => void;
  onToggleRegime: (regime: RegimeTributario) => void;
  onToggleTipo: (tipo: TipoDivergencia) => void;
};

export function RiskSegmentationPanel({
  items,
  activeNiveis,
  activeRegimes,
  activeTipos,
  onToggleNivel,
  onToggleRegime,
  onToggleTipo,
}: RiskSegmentationPanelProps) {
  const nivelStats = new Map<NivelRisco, { count: number; valorPotencial: number }>();
  const regimeCounts = new Map<RegimeTributario, number>();
  const tipoCounts = new Map<TipoDivergencia, number>();

  for (const item of items) {
    const nivel = nivelStats.get(item.nivel) ?? { count: 0, valorPotencial: 0 };
    nivel.count += 1;
    nivel.valorPotencial += item.valorPotencial ?? 0;
    nivelStats.set(item.nivel, nivel);

    regimeCounts.set(item.regime, (regimeCounts.get(item.regime) ?? 0) + 1);

    if (item.tipoInconsistencia) {
      tipoCounts.set(item.tipoInconsistencia, (tipoCounts.get(item.tipoInconsistencia) ?? 0) + 1);
    }
  }

  return (
    <section
      aria-label="Segmentação da carteira"
      className="grid gap-4 rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
    >
      <header className="grid gap-0.5">
        <h2 className="text-sm font-semibold text-text-strong">Segmentação da carteira</h2>
        <p className="text-xs text-muted-foreground">
          Selecione um ou mais recortes para filtrar a fila por nível de risco, porte/regime e tipo
          de inconsistência.
        </p>
      </header>

      <div className="grid gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Nível de risco
        </span>
        <div className="flex flex-wrap gap-1.5">
          {NIVEL_ORDER.filter((nivel) => nivelStats.has(nivel)).map((nivel) => {
            const stats = nivelStats.get(nivel);
            if (!stats) return null;
            const ativo = activeNiveis.includes(nivel);
            return (
              <button
                key={nivel}
                type="button"
                aria-pressed={ativo}
                onClick={() => onToggleNivel(nivel)}
                className={cn(
                  CHIP_BASE_CLASSES,
                  ativo ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES,
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: NIVEL_DOT_VAR[nivel] }}
                />
                {NIVEL_LABEL[nivel]} · {stats.count}
                {stats.valorPotencial > 0 ? (
                  <span className="font-data text-[11px]">
                    · {BRL_COMPACT.format(stats.valorPotencial)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Porte / regime
        </span>
        <div className="flex flex-wrap gap-1.5">
          {REGIME_ORDER.filter((regime) => regimeCounts.has(regime)).map((regime) => {
            const ativo = activeRegimes.includes(regime);
            return (
              <button
                key={regime}
                type="button"
                aria-pressed={ativo}
                onClick={() => onToggleRegime(regime)}
                className={cn(
                  CHIP_BASE_CLASSES,
                  ativo ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES,
                )}
              >
                {REGIME_LABEL[regime]} · {regimeCounts.get(regime)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Tipo de inconsistência
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TIPO_ORDER.filter((tipo) => tipoCounts.has(tipo)).map((tipo) => {
            const ativo = activeTipos.includes(tipo);
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={ativo}
                onClick={() => onToggleTipo(tipo)}
                className={cn(
                  CHIP_BASE_CLASSES,
                  ativo ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES,
                )}
              >
                {TIPO_LABEL[tipo]} · {tipoCounts.get(tipo)}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
