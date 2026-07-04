import type { SusAvaliacao } from "@fiscalcheck/shared-types";

/*
  Histórico de avaliações SUS respondidas pelos auditores. As respostas
  vieram do questionário embutido no Painel do Gestor (T17). A média
  dos scores alimenta a `meta-usabilidade` — a fórmula do SUS ("regra
  de Brooke") vive em `apps/web/lib/analytics/sus.ts` para ser testada
  em unit e reutilizada pelo handler MSW.

  Respostas usam Likert 1..5 seguindo a ordem oficial:
    1. Gostaria de usar esse sistema com frequência.
    2. Achei o sistema desnecessariamente complexo.
    3. Achei o sistema fácil de usar.
    4. Precisaria de apoio técnico para usar o sistema.
    5. Achei as funções bem integradas.
    6. Havia muita inconsistência no sistema.
    7. Imagino que a maioria aprenderia rápido.
    8. Achei o sistema desajeitado de usar.
    9. Me senti confiante ao usar o sistema.
   10. Precisei aprender muita coisa antes de conseguir usar.

  Pares (2,4,6,8,10) são negativas — a fórmula do SUS já compensa a
  inversão. Um score >= 68 é o limiar clássico de "aceitável".
*/

export const susAvaliacoesFixture: SusAvaliacao[] = [
  {
    id: "sus-2026-001",
    respondidoPor: "Auditora Marina Costa",
    respondidoEm: "2026-06-15T14:20:00Z",
    respostas: [4, 2, 4, 2, 4, 2, 4, 2, 4, 2],
    score: 75,
    comentario: "Fluxo de decisão intuitivo; sinto falta de atalhos de teclado no dossiê.",
  },
  {
    id: "sus-2026-002",
    respondidoPor: "Auditor João Almeida",
    respondidoEm: "2026-06-22T10:05:00Z",
    respostas: [3, 3, 4, 2, 4, 3, 4, 2, 3, 2],
    score: 65,
    comentario: "Copilot ajuda, mas a fila de casos poderia filtrar por CNAE.",
  },
  {
    id: "sus-2026-003",
    respondidoPor: "Auditora Renata Silveira",
    respondidoEm: "2026-07-02T14:20:00Z",
    respostas: [4, 2, 5, 2, 4, 2, 4, 1, 5, 2],
    score: 87,
    comentario: "Fluxo do dossiê ficou muito bom após T28.",
  },
];
