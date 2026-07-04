import type {
  KpiTrend,
  MetaPiloto,
  RelatorioGerencialRequest,
  RelatorioSecao,
  RelatorioTipo,
  SusAvaliacao,
} from "@fiscalcheck/shared-types";

/*
  Payload do relatório gerencial (T17). Agrega em memória o dado que
  o gerador de PDF/XLSX consome. Isolado em módulo próprio para ser
  reusado pelo modal e por testes unitários.

  Inclui `emitidoPor` (nome + papel) e `correlationId` porque o
  documento é peça auditável (mesmo pattern do dossiê T28).
*/

export type ReportSectionKey = RelatorioSecao;

export type ReportEmitter = {
  displayName: string;
  role: string;
  id: string;
};

export type ReportData = {
  tipo: RelatorioTipo;
  titulo: string;
  subtitulo: string;
  emitidoPor: ReportEmitter;
  emitidoEm: string;
  periodo: RelatorioGerencialRequest["periodo"];
  correlationId: string;
  secoes: readonly ReportSectionKey[];
  kpis: readonly KpiTrend[];
  metas: readonly MetaPiloto[];
  susAvaliacoes: readonly SusAvaliacao[];
  susMedia: number;
};

export const REPORT_SECOES_LABEL: Record<ReportSectionKey, string> = {
  kpis: "KPIs consolidados",
  metas: "Metas do piloto (70/100/80)",
  risco_distribuicao: "Distribuição de risco",
  sus: "Avaliação de usabilidade (SUS)",
  casos_criticos: "Casos críticos priorizados",
  trilha_auditoria: "Trilha de auditoria (resumo)",
};

export const REPORT_TIPO_LABEL: Record<RelatorioTipo, string> = {
  calibragem: "Relatório de Calibragem",
  validacao: "Relatório de Validação",
};

export const REPORT_SECOES_PADRAO: Record<RelatorioTipo, readonly ReportSectionKey[]> = {
  calibragem: ["kpis", "metas", "risco_distribuicao", "trilha_auditoria"],
  validacao: ["kpis", "metas", "sus", "casos_criticos"],
};
