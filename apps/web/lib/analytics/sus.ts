/*
  Utilitário de cálculo da escala SUS — System Usability Scale
  (Brooke, 1996). Fórmula clássica:

    Para itens ímpares (1,3,5,7,9)  → contribuição = resposta - 1
    Para itens pares   (2,4,6,8,10) → contribuição = 5 - resposta
    score = (soma das 10 contribuições) * 2.5

  Domínio: score ∈ [0, 100]. Limiar clássico de "aceitável" ≥ 68.
*/

export const SUS_QUESTOES_PT_BR: readonly string[] = [
  "Eu gostaria de usar esse sistema com frequência.",
  "Achei o sistema desnecessariamente complexo.",
  "Achei o sistema fácil de usar.",
  "Precisaria de apoio técnico para usar o sistema.",
  "Achei as funções do sistema bem integradas.",
  "Havia muita inconsistência no sistema.",
  "Imagino que a maioria das pessoas aprenderia a usar o sistema rapidamente.",
  "Achei o sistema desajeitado de usar.",
  "Me senti confiante ao usar o sistema.",
  "Precisei aprender muita coisa antes de conseguir usar o sistema.",
];

export const SUS_LIMIAR_ACEITAVEL = 68;

export const SUS_ESCALA_LABELS: readonly string[] = [
  "Discordo totalmente",
  "Discordo",
  "Neutro",
  "Concordo",
  "Concordo totalmente",
];

/**
 * Calcula o score SUS a partir das 10 respostas Likert 1..5.
 * Lança se o array não tem exatamente 10 posições ou valores fora do range.
 */
export function computeSusScore(respostas: readonly number[]): number {
  if (respostas.length !== 10) {
    throw new Error(`SUS espera 10 respostas, recebeu ${respostas.length}.`);
  }
  let soma = 0;
  for (let i = 0; i < 10; i += 1) {
    const resposta = respostas[i];
    if (
      typeof resposta !== "number" ||
      !Number.isInteger(resposta) ||
      resposta < 1 ||
      resposta > 5
    ) {
      throw new Error(`Resposta ${i + 1} inválida: esperado inteiro 1..5, veio ${resposta}.`);
    }
    // itens ímpares (índice par: 0,2,4,6,8) → resposta - 1
    // itens pares   (índice ímpar: 1,3,5,7,9) → 5 - resposta
    const contribuicao = i % 2 === 0 ? resposta - 1 : 5 - resposta;
    soma += contribuicao;
  }
  return soma * 2.5;
}

/**
 * Score médio ponderado (aritmético simples) de um conjunto de avaliações.
 * Retorna 0 quando não há avaliações — o consumer decide se mostra "sem
 * dados" ou 0 no card.
 */
export function computeSusMedia(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s, 0);
  return Math.round((total / scores.length) * 10) / 10;
}
