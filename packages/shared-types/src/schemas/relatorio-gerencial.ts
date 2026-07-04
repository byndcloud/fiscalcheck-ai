import { z } from "zod";

/*
  Relatórios gerenciais (T17 · módulo 5). O edital pede dois:

    · calibragem — sumário do modelo de risco (pesos, faixas, resíduos)
    · validacao — indicadores de aceitação do piloto (KPIs, metas, SUS)

  O documento é gerado 100% client-side (react-pdf para PDF, dynamic
  import de SheetJS para XLSX — ver ADR-0005/0006). O endpoint MSW
  apenas registra a intenção e devolve o `correlationId` para chain
  of custody igual ao dossiê (T28).

  As `secoes` são flags textuais que o cliente usa como toggle: cada
  documento sabe quais seções sabe renderizar; o backend só devolve o
  que foi pedido, para não emitir peça mais rica do que a solicitada.
*/

export const RelatorioTipoSchema = z.enum(["calibragem", "validacao"]);
export type RelatorioTipo = z.infer<typeof RelatorioTipoSchema>;

export const RelatorioFormatoSchema = z.enum(["pdf", "xlsx"]);
export type RelatorioFormato = z.infer<typeof RelatorioFormatoSchema>;

export const RelatorioSecaoSchema = z.enum([
  "kpis",
  "metas",
  "risco_distribuicao",
  "sus",
  "casos_criticos",
  "trilha_auditoria",
]);
export type RelatorioSecao = z.infer<typeof RelatorioSecaoSchema>;

export const PeriodoSchema = z.object({
  inicio: z.string(),
  fim: z.string(),
});
export type Periodo = z.infer<typeof PeriodoSchema>;

export const RelatorioGerencialRequestSchema = z.object({
  tipo: RelatorioTipoSchema,
  formato: RelatorioFormatoSchema,
  periodo: PeriodoSchema,
  secoes: z.array(RelatorioSecaoSchema).min(1),
  correlationId: z.string().min(1),
});
export type RelatorioGerencialRequest = z.infer<typeof RelatorioGerencialRequestSchema>;

export const RelatorioGerencialResponseSchema = z.object({
  filename: z.string().min(1),
  correlationId: z.string().min(1),
  bytesMock: z.number().int().nonnegative(),
  emitidoEm: z.string(),
});
export type RelatorioGerencialResponse = z.infer<typeof RelatorioGerencialResponseSchema>;
