import type { Divergencia } from "@fiscalcheck/shared-types";

export const divergenciasFixture: Divergencia[] = [
  {
    id: "dv-001",
    contribuinteId: "ct-001",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 4,
    valor: 84_500.0,
    competencia: "2026-05",
    descricao:
      "Valor declarado no PGDAS (R$ 120.500,00) menor que a soma de NFS-e emitidas no período (R$ 205.000,00).",
    detectadoEm: "2026-07-01T09:15:00Z",
    evidencias: ["nf-1041", "nf-1042", "nf-1043"],
  },
  {
    id: "dv-002",
    contribuinteId: "ct-003",
    tipo: "regime_incorreto",
    origem: "cadastro",
    severidade: 5,
    valor: null,
    descricao:
      "Contribuinte no Simples Nacional cujo faturamento acumulado excedeu o teto anual em 2 competências.",
    detectadoEm: "2026-06-28T14:02:00Z",
    evidencias: ["arq-002"],
  },
  {
    id: "dv-003",
    contribuinteId: "ct-002",
    tipo: "omissao",
    origem: "declarado_vs_nfse",
    severidade: 3,
    valor: 12_300.0,
    competencia: "2026-06",
    descricao:
      "Duas NFS-e emitidas para tomadores no exterior sem declaração correspondente na apuração.",
    detectadoEm: "2026-07-02T08:50:00Z",
    evidencias: ["nf-2077", "nf-2081"],
  },
  {
    id: "dv-004",
    contribuinteId: "ct-005",
    tipo: "endereco_inconsistente",
    origem: "grafo_socios",
    severidade: 2,
    valor: null,
    descricao:
      "Endereço declarado coincide com o de outro contribuinte suspenso, mesmo bloco de sócios.",
    detectadoEm: "2026-06-30T11:20:00Z",
    evidencias: ["ct-004"],
  },
  {
    id: "dv-005",
    contribuinteId: "ct-001",
    tipo: "socio_vinculado",
    origem: "grafo_socios",
    severidade: 3,
    valor: null,
    descricao:
      "Sócio Ricardo T. também aparece em CT-004 (situação suspensa) com participação relevante.",
    detectadoEm: "2026-07-01T18:11:00Z",
    evidencias: ["ct-004"],
  },
  {
    id: "dv-006",
    contribuinteId: "ct-004",
    tipo: "subdeclaracao",
    origem: "declarado_vs_nfse",
    severidade: 2,
    valor: 18_500.0,
    competencia: "2026-03",
    descricao:
      "ISS apurado sobre NFS-e do período (R$ 43.200,00) superior ao valor declarado e recolhido (R$ 24.700,00).",
    detectadoEm: "2026-06-10T10:05:00Z",
    evidencias: ["nf-3110", "nf-3112", "nf-3119"],
  },
];
