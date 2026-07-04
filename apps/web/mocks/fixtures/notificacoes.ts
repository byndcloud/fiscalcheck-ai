import type { Notificacao } from "@fiscalcheck/shared-types";

/*
  As notificações são armazenadas em módulo — a "marca como lida"
  do handler `POST /notifications/:id/read` muta este array em memória.
*/
export const notificacoesFixture: Notificacao[] = [
  {
    id: "nt-001",
    tipo: "caso_alto_risco",
    titulo: "Novo caso de risco crítico",
    corpo: "CT-003 excedeu teto do Simples Nacional — pauta prioritária.",
    casoId: "cs-2026-0139",
    contribuinteId: "ct-003",
    severidade: 5,
    criadoEm: "2026-06-29T09:20:00Z",
    lida: false,
    origem: "manual",
  },
  {
    id: "nt-002",
    tipo: "prazo",
    titulo: "Prazo em 24h",
    corpo: "Caso CS-2026-0128 aguarda resposta do contribuinte — prazo em 05/07.",
    casoId: "cs-2026-0128",
    contribuinteId: "ct-002",
    severidade: 3,
    criadoEm: "2026-07-02T09:00:00Z",
    lida: false,
    origem: "manual",
  },
  {
    id: "nt-003",
    tipo: "devolutiva",
    titulo: "Devolutiva do contribuinte",
    corpo: "CT-002 enviou documentos de exportação de serviço.",
    casoId: "cs-2026-0128",
    contribuinteId: "ct-002",
    severidade: 2,
    criadoEm: "2026-07-01T18:47:00Z",
    lida: true,
    lidaEm: "2026-07-02T08:12:00Z",
    origem: "manual",
  },
  {
    id: "nt-004",
    tipo: "meta_risco",
    titulo: "Meta de recuperação em risco",
    corpo:
      "Meta do trimestre está 12 pontos atrás do previsto — 3 casos parados aguardando análise.",
    severidade: 4,
    criadoEm: "2026-07-02T12:00:00Z",
    lida: false,
    origem: "auto_meta",
    linkHref: "/analytics#metas",
  },
];
