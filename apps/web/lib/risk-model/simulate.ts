import type {
  NivelRisco,
  RiskFactorOrigin,
  RiskModelBands,
  RiskModelConfig,
  RiskModelRule,
  RiskModelWeights,
  Score,
} from "@fiscalcheck/shared-types";

/*
  Simulação pura do Modelo de Risco (T02 · módulo 3).

  Objetivo: dar ao Gestor um preview auditável de "o que muda na fila se
  eu publicar essa configuração" — sem precisar de round-trip com o
  backend. Os cálculos abaixo são estáveis e determinísticos: a mesma
  entrada sempre produz a mesma saída.

  Não é a fórmula real do modelo produtivo; é uma aproximação suficiente
  para o POC e alinhada ao critério de aceite "alterar um peso/faixa
  reordena a fila de risco de forma coerente".
*/

/*
  Normaliza os pesos para somarem 1. Assim conseguimos comparar duas
  configurações mesmo quando o Gestor não fecha exatamente em 1.0 na UI
  — o que evita travar a experiência com aritmética de ponto flutuante.
*/
function normalizeWeights(weights: RiskModelWeights): RiskModelWeights {
  const total = weights.cruzamento + weights.grafo + weights.cadastro + weights.historico;
  if (total <= 0) return weights;
  return {
    cruzamento: weights.cruzamento / total,
    grafo: weights.grafo / total,
    cadastro: weights.cadastro / total,
    historico: weights.historico / total,
  };
}

function isCategoryEnabled(rules: readonly RiskModelRule[], category: RiskFactorOrigin): boolean {
  return rules.some((rule) => rule.category === category && rule.enabled);
}

/*
  Reclassifica um valor em `NivelRisco` conforme as faixas configuradas.
  Contrato: bands satisfazem 0 < baixo < medio < alto < critico ≤ 100.
  Valor < baixo => conforme; ≥ critico => critico.
*/
export function classifyByBands(value: number, bands: RiskModelBands): NivelRisco {
  if (value < bands.baixo) return "conforme";
  if (value < bands.medio) return "baixo";
  if (value < bands.alto) return "medio";
  if (value < bands.critico) return "alto";
  return "critico";
}

/*
  Aplica o novo peso categórico sobre a contribuição declarada de cada
  fator, mantendo o "sinal" original (positivo aumenta risco; negativo
  reduz — típico de fatores mitigadores como "regularidade histórica").
  Se a regra da categoria estiver desligada, o fator é zerado.
*/
export function simulateScoreValue(score: Score, config: RiskModelConfig): number {
  const weights = normalizeWeights(config.weights);
  const total = score.fatores.reduce((acc, fator) => {
    if (!isCategoryEnabled(config.rules, fator.origem)) return acc;
    const categoryWeight = weights[fator.origem];
    /*
      Multiplicador de escala: 4 categorias * 0.25 (uniforme) = 1.0.
      Assim, se o Gestor mantém pesos uniformes, o score simulado é
      próximo do original — pequenas variações vêm da normalização.
    */
    return acc + fator.contribuicao * categoryWeight * 4;
  }, 0);

  return Math.max(0, Math.min(100, Math.round(total)));
}

export type SimulatedScore = {
  contribuinteId: string;
  originalValue: number;
  originalLevel: NivelRisco;
  simulatedValue: number;
  simulatedLevel: NivelRisco;
  levelChanged: boolean;
  delta: number;
};

export type SimulationSummary = {
  total: number;
  levelChangedCount: number;
  moved: SimulatedScore[];
  distributionBefore: Record<NivelRisco, number>;
  distributionAfter: Record<NivelRisco, number>;
};

const EMPTY_DISTRIBUTION: Record<NivelRisco, number> = {
  conforme: 0,
  baixo: 0,
  medio: 0,
  alto: 0,
  critico: 0,
};

export function simulateAll(scores: readonly Score[], config: RiskModelConfig): SimulationSummary {
  const distributionBefore: Record<NivelRisco, number> = { ...EMPTY_DISTRIBUTION };
  const distributionAfter: Record<NivelRisco, number> = { ...EMPTY_DISTRIBUTION };
  const items: SimulatedScore[] = scores.map((score) => {
    const simulatedValue = simulateScoreValue(score, config);
    const simulatedLevel = classifyByBands(simulatedValue, config.bands);
    distributionBefore[score.nivel] += 1;
    distributionAfter[simulatedLevel] += 1;
    return {
      contribuinteId: score.contribuinteId,
      originalValue: score.valor,
      originalLevel: score.nivel,
      simulatedValue,
      simulatedLevel,
      levelChanged: simulatedLevel !== score.nivel,
      delta: simulatedValue - score.valor,
    };
  });

  const moved = items
    .filter((item) => item.levelChanged)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    total: items.length,
    levelChangedCount: moved.length,
    moved,
    distributionBefore,
    distributionAfter,
  };
}

/*
  Compara duas configurações e devolve os caminhos alterados —
  usado no `summary` do publish, para deixar a descrição do change
  legível ao Gestor sem depender de diff estrutural genérico.
*/
export function diffConfigs(
  previous: RiskModelConfig,
  next: Pick<RiskModelConfig, "weights" | "bands" | "rules">,
): string[] {
  const changed: string[] = [];

  for (const key of Object.keys(previous.weights) as (keyof RiskModelWeights)[]) {
    if (previous.weights[key] !== next.weights[key]) {
      changed.push(`weights.${key}`);
    }
  }

  for (const key of Object.keys(previous.bands) as (keyof RiskModelBands)[]) {
    if (previous.bands[key] !== next.bands[key]) {
      changed.push(`bands.${key}`);
    }
  }

  const previousRules = new Map(previous.rules.map((rule) => [rule.id, rule]));
  for (const rule of next.rules) {
    const prior = previousRules.get(rule.id);
    if (!prior || prior.enabled !== rule.enabled) {
      changed.push(`rules.${rule.id}`);
    }
  }

  return changed;
}
