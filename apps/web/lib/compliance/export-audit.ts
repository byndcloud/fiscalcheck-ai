import type { AuditLogEntry } from "@fiscalcheck/shared-types";

/*
  Export da trilha de auditoria para órgão de controle (T19 · módulo 6).

  Gera CSV ou JSON a partir dos eventos JÁ FILTRADOS pelo Admin e
  dispara download via Blob. Em paralelo, faz um POST para o próprio
  endpoint da trilha para registrar a INTENÇÃO de export como um
  evento novo (append-only real) — o Fisco precisa saber quem
  exportou o quê e quando.
*/

export type ExportFormat = "csv" | "json";

/*
  Colunas do CSV — ordem e nomes pensados para revisão manual em
  planilha. Campos multi-linha são substituídos por espaço para
  preservar o delimitador; aspas são escapadas dobrando-as (RFC 4180).
*/
const CSV_COLUMNS: ReadonlyArray<[string, (e: AuditLogEntry) => string]> = [
  ["id", (e) => e.id],
  ["timestamp", (e) => e.timestamp],
  ["actor_id", (e) => e.actorId],
  ["actor_name", (e) => e.actorName],
  ["actor_role", (e) => e.actorRole],
  ["ip", (e) => e.ipAddress],
  ["action", (e) => e.action],
  ["resource", (e) => e.resource],
  ["result", (e) => e.result],
  ["atypical", (e) => String(e.atypical)],
  ["atypical_reason", (e) => e.atypicalReason ?? ""],
  ["correlation_id", (e) => e.correlationId],
  ["details", (e) => e.details],
  ["dados_acessados", (e) => e.dadosAcessados ?? ""],
];

function escapeCsv(value: string): string {
  const clean = value.replace(/[\r\n]+/g, " ").trim();
  if (/[",;]/.test(clean)) return `"${clean.replace(/"/g, '""')}"`;
  return clean;
}

export function entriesToCsv(entries: readonly AuditLogEntry[]): string {
  const header = CSV_COLUMNS.map(([name]) => name).join(",");
  const rows = entries.map((e) => CSV_COLUMNS.map(([, getter]) => escapeCsv(getter(e))).join(","));
  return [header, ...rows].join("\r\n");
}

export function entriesToJson(entries: readonly AuditLogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/*
  Dispara o download no browser. Nome do arquivo carimba data e
  formato. Chamador é responsável por revogar o objectURL (aqui já é
  feito no proximo tick para dar tempo ao browser de iniciar o
  download).
*/
export function downloadBlob(filename: string, blob: Blob): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function timestampSlug(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

/*
  API pública. Recebe os eventos JÁ FILTRADOS e o formato desejado,
  executa o download e devolve o total exportado para o chamador
  registrar no audit via `POST /compliance/audit-log-v2/export`.
*/
export function exportAuditEntries(
  entries: readonly AuditLogEntry[],
  format: ExportFormat,
): { total: number; filename: string } {
  const filename = `fiscalcheck-trilha-${timestampSlug()}.${format}`;
  if (format === "csv") {
    const csv = entriesToCsv(entries);
    downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  } else {
    const json = entriesToJson(entries);
    downloadBlob(filename, new Blob([json], { type: "application/json;charset=utf-8" }));
  }
  return { total: entries.length, filename };
}
