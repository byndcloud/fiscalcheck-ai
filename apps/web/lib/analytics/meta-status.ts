import type { MetaPiloto, MetaStatus } from "@fiscalcheck/shared-types";

/*
  Regra determinística de status da meta (T17 · módulo 5).

  Baseado em duas dimensões:
    · progresso (0..1) = (atual - baseline) / (alvo - baseline)
    · prazo restante em dias

  - progresso >= 1.0 → sempre `no_alvo`
  - prazo > 30 dias → `no_alvo` (ainda há tempo de recuperar)
  - prazo <= 30 dias e 0.3 <= progresso < 0.6 → `em_risco`
  - prazo <= 30 dias e progresso < 0.3 → `critico`
  - qualquer outro caso → `no_alvo`

  A fórmula é reflexiva sobre a direção da meta (baseline < alvo).
  Se um dia surgir meta invertida (alvo < baseline, ex.: reduzir
  divergências críticas), basta calcular o progresso com sinais
  simétricos — o schema `MetaPiloto` mantém baseline/alvo como raw.
*/

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PRAZO_ALERTA_DIAS = 30;
const PROGRESSO_EM_RISCO = 0.6;
const PROGRESSO_CRITICO = 0.3;

export function computeProgressoPct(baseline: number, atual: number, alvo: number): number {
  const denominador = alvo - baseline;
  if (denominador === 0) return atual >= alvo ? 1 : 0;
  const progresso = (atual - baseline) / denominador;
  return Math.max(0, Math.min(1, progresso));
}

export function computeMetaStatus(input: {
  baseline: number;
  atual: number;
  alvo: number;
  prazoEm: string;
  now?: Date;
}): { status: MetaStatus; progressoPct: number; diasRestantes: number } {
  const { baseline, atual, alvo, prazoEm, now = new Date() } = input;
  const progressoPct = computeProgressoPct(baseline, atual, alvo);
  const prazoDate = new Date(prazoEm);
  const diasRestantes = Math.max(0, Math.round((prazoDate.getTime() - now.getTime()) / MS_PER_DAY));

  if (progressoPct >= 1) {
    return { status: "no_alvo", progressoPct, diasRestantes };
  }
  if (diasRestantes > PRAZO_ALERTA_DIAS) {
    return { status: "no_alvo", progressoPct, diasRestantes };
  }
  if (progressoPct < PROGRESSO_CRITICO) {
    return { status: "critico", progressoPct, diasRestantes };
  }
  if (progressoPct < PROGRESSO_EM_RISCO) {
    return { status: "em_risco", progressoPct, diasRestantes };
  }
  return { status: "no_alvo", progressoPct, diasRestantes };
}

/**
 * Aplica o cálculo em uma meta, devolvendo cópia com status/progresso
 * recomputados. Não muta o objeto original — importante porque a
 * fixture é reutilizada entre chamadas no handler in-memory.
 */
export function refreshMeta(meta: MetaPiloto, now?: Date): MetaPiloto {
  const computed = computeMetaStatus({
    baseline: meta.baseline,
    atual: meta.atual,
    alvo: meta.alvo,
    prazoEm: meta.prazoEm,
    now,
  });
  return {
    ...meta,
    status: computed.status,
    progressoPct: computed.progressoPct,
  };
}
