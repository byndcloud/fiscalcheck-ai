import { z } from "zod";

/*
  Painel do Gestor (T17 · módulo 5). Estende os KPIs enxutos do painel
  gerencial atual com série temporal (sparkline) e tendência por
  indicador para leitura em tempo real. Serve também de contrato para
  drill-down: o `drillDownHref` opcional aponta para a fila filtrada
  em `/cases` ou análise adjacente.

  Filtro por período é responsabilidade do handler MSW — o schema
  apenas descreve o intervalo devolvido.
*/

export const PanelManagerPeriodoSchema = z.enum(["30d", "90d", "trimestre", "ano"]);
export type PanelManagerPeriodo = z.infer<typeof PanelManagerPeriodoSchema>;

export const KpiTrendSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  descricao: z.string().optional(),
  unidade: z.enum(["brl", "int", "pct", "score"]),
  valor: z.number(),
  variacaoPct: z.number(),
  positive: z.boolean(),
  sub: z.string().optional(),
  serie: z.array(z.number()).min(2),
  drillDownHref: z.string().optional(),
});
export type KpiTrend = z.infer<typeof KpiTrendSchema>;

export const PanelManagerKpisSchema = z.object({
  periodo: PanelManagerPeriodoSchema,
  atualizadoEm: z.string(),
  kpis: z.array(KpiTrendSchema).min(6),
});
export type PanelManagerKpis = z.infer<typeof PanelManagerKpisSchema>;
