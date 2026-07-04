import type { ReportData } from "./types";
import { REPORT_SECOES_LABEL } from "./types";

/*
  Gerador de XLSX (T17). REGRA CRÍTICA: o import de `xlsx` PRECISA
  ser dinâmico. O bundle da lib (~500 KB gz — ADR-0006) só entra no
  chunk desta rota; qualquer import estático quebra a promessa.

  Cada seção do relatório vira uma sheet própria. Formatos numéricos
  (moeda BRL / percentual) usam propriedade `t: "n"` + `z` (Number
  Format) para o Excel renderizar corretamente.
*/

const PCT_FMT = "0%";
const BRL_FMT = "R$ #,##0";

function formatMetaValueRaw(value: number, unidade: string): { v: number; z?: string } {
  if (unidade === "pct") return { v: value, z: PCT_FMT };
  return { v: value };
}

function formatKpiValueRaw(value: number, unidade: string): { v: number; z?: string } {
  if (unidade === "brl") return { v: value, z: BRL_FMT };
  if (unidade === "pct") return { v: value, z: PCT_FMT };
  return { v: value };
}

export async function generateXlsxBlob(data: ReportData): Promise<Blob> {
  /*
    Dynamic import — a lib xlsx (SheetJS Community, ~500 KB gz) só
    é baixada quando o gestor clica em "Gerar XLSX". Ver ADR-0006.
  */
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // Sheet 1: capa
  const capaAoA: (string | number)[][] = [
    ["FiscalCheck AI · Painel do Gestor"],
    [data.titulo],
    [data.subtitulo],
    [],
    ["Período", data.periodo.inicio, data.periodo.fim],
    ["Emitido por", data.emitidoPor.displayName, data.emitidoPor.role],
    ["Correlation ID", data.correlationId],
    ["Emitido em", data.emitidoEm],
  ];
  const capaSheet = XLSX.utils.aoa_to_sheet(capaAoA);
  capaSheet["!cols"] = [{ wch: 22 }, { wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, capaSheet, "Capa");

  const has = (key: string) => data.secoes.includes(key as never);

  if (has("kpis") && data.kpis.length > 0) {
    const header = ["KPI", "Descrição", "Valor", "Variação (%)", "Positivo"];
    const rows: (string | number | { v: number; z?: string })[][] = [header];
    for (const k of data.kpis) {
      rows.push([
        k.label,
        k.descricao ?? "",
        formatKpiValueRaw(k.valor, k.unidade),
        { v: k.variacaoPct / 100, z: PCT_FMT },
        k.positive ? "sim" : "não",
      ]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: false });
    sheet["!cols"] = [{ wch: 26 }, { wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, sheet, "KPIs");
  }

  if (has("metas") && data.metas.length > 0) {
    const header = ["Meta", "Baseline", "Atual", "Alvo", "Progresso", "Status", "Prazo"];
    const rows: (string | number | { v: number; z?: string })[][] = [header];
    for (const m of data.metas) {
      rows.push([
        m.nome,
        formatMetaValueRaw(m.baseline, m.unidade),
        formatMetaValueRaw(m.atual, m.unidade),
        formatMetaValueRaw(m.alvo, m.unidade),
        { v: m.progressoPct, z: PCT_FMT },
        m.status,
        m.prazoEm.slice(0, 10),
      ]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [
      { wch: 32 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, sheet, "Metas");
  }

  if (has("sus") && data.susAvaliacoes.length > 0) {
    const header = ["Avaliação", "Respondido por", "Data", "Score"];
    const rows: (string | number)[][] = [header];
    for (const s of data.susAvaliacoes) {
      rows.push([s.id, s.respondidoPor, s.respondidoEm.slice(0, 10), s.score]);
    }
    rows.push([]);
    rows.push(["Média SUS", "", "", data.susMedia]);
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 18 }, { wch: 32 }, { wch: 14 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, sheet, "SUS");
  }

  // Índice das seções incluídas — útil pra conferência
  const indexRows: (string | number)[][] = [["Seção", "Descrição"]];
  for (const s of data.secoes) {
    indexRows.push([s, REPORT_SECOES_LABEL[s]]);
  }
  const indexSheet = XLSX.utils.aoa_to_sheet(indexRows);
  indexSheet["!cols"] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, indexSheet, "Índice");

  const arrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
