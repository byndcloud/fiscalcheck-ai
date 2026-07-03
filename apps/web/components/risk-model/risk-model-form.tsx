"use client";

import { RotateCcwIcon } from "lucide-react";

import type {
  RiskFactorOrigin,
  RiskModelBands,
  RiskModelConfig,
  RiskModelRule,
  RiskModelWeights,
} from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/*
  Formulário de parametrização (T02 · módulo 3).
  - Sliders de peso por CATEGORIA (0..100 em pontos percentuais).
  - Sliders de faixa (0..100) — cada uma coagida ao intervalo válido
    para nunca quebrar a regra 0 < baixo < médio < alto < crítico.
  - Toggle por regra (categoria de fator).
  Restrito a Gestor/Admin — o `readOnly` desabilita interação para
  qualquer outro papel que tenha caído aqui por engano.
*/

type RiskModelFormProps = {
  draft: RiskModelDraft;
  baseline: RiskModelConfig;
  onDraftChange: (draft: RiskModelDraft) => void;
  readOnly?: boolean;
};

export type RiskModelDraft = {
  weights: RiskModelWeights;
  bands: RiskModelBands;
  rules: RiskModelRule[];
};

const WEIGHT_LABEL: Record<RiskFactorOrigin, string> = {
  cruzamento: "Cruzamento declarado × NFS-e",
  grafo: "Rede societária e endereço",
  cadastro: "Consistência cadastral e regime",
  historico: "Histórico de autuações",
};

const WEIGHT_DESCRIPTION: Record<RiskFactorOrigin, string> = {
  cruzamento: "Peso dos sinais vindos do cruzamento entre declaração e NFS-e emitidas.",
  grafo: "Peso dos sinais vindos do graph analytics (sócios, endereços, comunidades).",
  cadastro: "Peso dos sinais vindos do cadastro mobiliário (CNAE, regime, teto do Simples).",
  historico: "Peso do histórico do contribuinte (autuações mantidas, sazonalidade típica).",
};

const WEIGHT_ORDER: readonly RiskFactorOrigin[] = ["cruzamento", "grafo", "cadastro", "historico"];

const BAND_META: {
  key: keyof RiskModelBands;
  label: string;
  toneClass: string;
  helper: string;
}[] = [
  {
    key: "baixo",
    label: "Conforme → Baixo",
    toneClass: "bg-risk-1",
    helper: "Score abaixo desse valor é considerado conforme.",
  },
  {
    key: "medio",
    label: "Baixo → Médio",
    toneClass: "bg-risk-2",
    helper: "Limite superior da faixa de risco baixo.",
  },
  {
    key: "alto",
    label: "Médio → Alto",
    toneClass: "bg-risk-3",
    helper: "Limite superior da faixa de risco médio.",
  },
  {
    key: "critico",
    label: "Alto → Crítico",
    toneClass: "bg-risk-4",
    helper: "Score igual ou acima desse valor entra em risco crítico.",
  },
];

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function RiskModelForm({
  draft,
  baseline,
  onDraftChange,
  readOnly = false,
}: RiskModelFormProps) {
  const weightTotalPct = Math.round(
    (draft.weights.cruzamento +
      draft.weights.grafo +
      draft.weights.cadastro +
      draft.weights.historico) *
      100,
  );

  const handleWeightChange = (key: RiskFactorOrigin, nextPct: number) => {
    onDraftChange({
      ...draft,
      weights: { ...draft.weights, [key]: nextPct / 100 },
    });
  };

  const handleBandChange = (key: keyof RiskModelBands, nextValue: number) => {
    /*
      Coerção defensiva para manter a ordem crescente. O DS pede sinais
      claros — em vez de bloquear a interação com min/max dinâmicos (que
      "empurram" o thumb), corrigimos silenciosamente aqui.
    */
    const coerced = coerceBand(draft.bands, key, nextValue);
    onDraftChange({ ...draft, bands: coerced });
  };

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    onDraftChange({
      ...draft,
      rules: draft.rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule)),
    });
  };

  const handleReset = () => {
    onDraftChange({
      weights: { ...baseline.weights },
      bands: { ...baseline.bands },
      rules: baseline.rules.map((rule) => ({ ...rule })),
    });
  };

  return (
    <section
      aria-label="Configuração do modelo de risco"
      className="grid gap-6 rounded-[var(--r-lg)] border border-border bg-surface p-6 shadow-[var(--e-1)]"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-[15px] font-bold text-text-strong">Parâmetros do modelo</h2>
          <p className="text-xs text-muted-foreground">
            Ajuste pesos por categoria, faixas de score e regras ativas. As alterações recalculam o
            preview em tempo real; nada é publicado até a confirmação.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={readOnly}
          aria-label="Restaurar valores da versão publicada"
        >
          <RotateCcwIcon aria-hidden="true" />
          Restaurar publicado
        </Button>
      </header>

      {/* --- Pesos por categoria --- */}
      <fieldset className="grid gap-4" disabled={readOnly}>
        <div className="flex items-center justify-between">
          <legend className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            Pesos por categoria de fator
          </legend>
          <WeightTotalBadge totalPct={weightTotalPct} />
        </div>
        <ul className="grid gap-4">
          {WEIGHT_ORDER.map((key) => {
            const draftPct = Math.round(draft.weights[key] * 100);
            const baselinePct = Math.round(baseline.weights[key] * 100);
            const delta = draftPct - baselinePct;
            return (
              <li
                key={key}
                className="grid gap-2 rounded-[var(--r-md)] border border-border/60 bg-n-25/40 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Label
                    htmlFor={`weight-${key}`}
                    className="text-[13px] font-semibold text-text-strong"
                  >
                    {WEIGHT_LABEL[key]}
                  </Label>
                  <div className="flex items-baseline gap-2 font-data">
                    <span className="text-base font-semibold text-text-strong">
                      {formatPercent(draft.weights[key])}
                    </span>
                    {delta !== 0 ? (
                      <span
                        className={cn(
                          "text-[11px] font-semibold",
                          delta > 0 ? "text-risk-4" : "text-risk-2",
                        )}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta} pp
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        publicado
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{WEIGHT_DESCRIPTION[key]}</p>
                <Slider
                  id={`weight-${key}`}
                  value={[draftPct]}
                  min={0}
                  max={100}
                  step={1}
                  aria-label={`Peso da categoria ${WEIGHT_LABEL[key]}`}
                  aria-valuetext={formatPercent(draft.weights[key])}
                  onValueChange={(next) => {
                    const first = next[0];
                    if (typeof first === "number") handleWeightChange(key, first);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* --- Faixas de score --- */}
      <fieldset className="grid gap-4" disabled={readOnly}>
        <legend className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          Faixas de score
        </legend>

        <BandsGradientMap bands={draft.bands} />

        <ul className="grid gap-4 sm:grid-cols-2">
          {BAND_META.map((band) => {
            const draftValue = draft.bands[band.key];
            const baselineValue = baseline.bands[band.key];
            const delta = draftValue - baselineValue;
            return (
              <li
                key={band.key}
                className="grid gap-2 rounded-[var(--r-md)] border border-border/60 bg-n-25/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label
                    htmlFor={`band-${band.key}`}
                    className="flex items-center gap-2 text-[13px] font-semibold text-text-strong"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 rounded-full", band.toneClass)}
                    />
                    {band.label}
                  </Label>
                  <div className="flex items-baseline gap-2 font-data">
                    <span className="text-base font-semibold text-text-strong">{draftValue}</span>
                    {delta !== 0 ? (
                      <span
                        className={cn(
                          "text-[11px] font-semibold",
                          delta > 0 ? "text-risk-4" : "text-risk-2",
                        )}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        publicado
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{band.helper}</p>
                <Slider
                  id={`band-${band.key}`}
                  value={[draftValue]}
                  min={1}
                  max={100}
                  step={1}
                  aria-label={`Limiar ${band.label}`}
                  onValueChange={(next) => {
                    const first = next[0];
                    if (typeof first === "number") handleBandChange(band.key, first);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* --- Regras de detecção --- */}
      <fieldset className="grid gap-3" disabled={readOnly}>
        <legend className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
          Regras de detecção
        </legend>
        <ul className="grid gap-2">
          {draft.rules.map((rule) => {
            const baselineRule = baseline.rules.find((r) => r.id === rule.id);
            const changed = baselineRule && baselineRule.enabled !== rule.enabled;
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex items-start gap-4 rounded-[var(--r-md)] border p-4 transition-colors",
                  rule.enabled ? "border-border/60 bg-surface" : "border-border/60 bg-n-25/60",
                )}
              >
                <div className="flex-1 grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-text-strong">{rule.label}</p>
                    {changed ? (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--c-risk-3-txt)]">
                        alterada
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
                <div className="grid justify-items-end gap-1">
                  <Switch
                    id={`rule-${rule.id}`}
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleRuleToggle(rule.id, checked)}
                    aria-label={`Ativar regra ${rule.label}`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {rule.enabled ? "Ativa" : "Desativada"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </section>
  );
}

function WeightTotalBadge({ totalPct }: { totalPct: number }) {
  const balanced = totalPct >= 95 && totalPct <= 105;
  return (
    <output
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        balanced
          ? "border-[color-mix(in_srgb,var(--c-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--c-success)_12%,var(--surface))] text-[color:var(--c-risk-1-txt)]"
          : "border-[color-mix(in_srgb,var(--c-risk-3)_40%,transparent)] bg-[color-mix(in_srgb,var(--c-risk-3)_16%,var(--surface))] text-[color:var(--c-risk-3-txt)]",
      )}
      aria-live="polite"
    >
      Soma dos pesos: {totalPct}%
      {!balanced ? <span className="font-normal">· será renormalizada</span> : null}
    </output>
  );
}

function BandsGradientMap({ bands }: { bands: RiskModelBands }) {
  return (
    <div className="grid gap-2">
      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundImage: "var(--grad-risk)" }}
        aria-hidden="true"
      >
        {[bands.baixo, bands.medio, bands.alto, bands.critico].map((value) => (
          <span
            key={`marker-${value}`}
            className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(16,24,40,0.35)]"
            style={{ left: `${value}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-data text-[10px] font-semibold text-muted-foreground">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}

function coerceBand(
  bands: RiskModelBands,
  key: keyof RiskModelBands,
  nextValue: number,
): RiskModelBands {
  const clamped = Math.max(1, Math.min(100, Math.round(nextValue)));
  const draft: RiskModelBands = { ...bands, [key]: clamped };

  const order: (keyof RiskModelBands)[] = ["baixo", "medio", "alto", "critico"];
  const targetIndex = order.indexOf(key);

  // Empurra vizinhos anteriores para trás (mínimo 1 unidade de gap).
  for (let i = targetIndex - 1; i >= 0; i -= 1) {
    const currentKey = order[i];
    const nextKey = order[i + 1];
    if (currentKey === undefined || nextKey === undefined) continue;
    const currentValue = draft[currentKey];
    const nextValueThreshold = draft[nextKey];
    if (currentValue >= nextValueThreshold) {
      draft[currentKey] = Math.max(1, nextValueThreshold - 1);
    }
  }

  // Empurra vizinhos posteriores para frente.
  for (let i = targetIndex + 1; i < order.length; i += 1) {
    const currentKey = order[i];
    const prevKey = order[i - 1];
    if (currentKey === undefined || prevKey === undefined) continue;
    const currentValue = draft[currentKey];
    const prevValueThreshold = draft[prevKey];
    if (currentValue <= prevValueThreshold) {
      draft[currentKey] = Math.min(100, prevValueThreshold + 1);
    }
  }

  return draft;
}
