import type { SmartAlert } from "@fiscalcheck/shared-types";

/*
  Alertas inteligentes emitidos pela esteira de agentes.
  Dados pseudonimizados (razão social fictícia, sem CNPJ real).
*/
export const smartAlertsFixture: SmartAlert[] = [
  {
    id: "alr-2026-0602-crit",
    tipo: "critico",
    tag: "Crítico",
    mensagem:
      "Contribuinte ct-042 ultrapassou score 90 após nova carga NFS-e. Materialidade estimada em R$ 248,5 mil.",
    emitidoEm: "2026-07-02T13:48:00Z",
    relativoAtual: "há 12 min",
    linkHref: "/cases",
  },
  {
    id: "alr-2026-0602-rede",
    tipo: "rede",
    tag: "Rede",
    mensagem:
      "Comunidade suspeita C-07: 6 contribuintes com mesmo endereço e sócio em comum. Possível fragmentação de receita.",
    emitidoEm: "2026-07-02T13:00:00Z",
    relativoAtual: "há 1 h",
    linkHref: "/crossing",
  },
  {
    id: "alr-2026-0602-meta",
    tipo: "meta",
    tag: "Meta",
    mensagem: "Acurácia do modelo atingiu 91,4%, acima da meta pactuada de 90% no piloto.",
    emitidoEm: "2026-07-02T09:00:00Z",
    relativoAtual: "hoje",
    linkHref: "/analytics",
  },
];
