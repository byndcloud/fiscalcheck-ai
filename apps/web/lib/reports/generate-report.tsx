import type {
  RelatorioFormato,
  RelatorioGerencialRequest,
  RelatorioGerencialResponse,
} from "@fiscalcheck/shared-types";

import { downloadBlob } from "@/lib/compliance/export-audit";

import { generateXlsxBlob } from "./build-xlsx";
import type { ReportData } from "./types";

/*
  Orquestrador do gerador de relatórios gerenciais (T17).

  Fluxo:
    1. Constrói o Blob (PDF via react-pdf ou XLSX via SheetJS).
       Ambos são gerados client-side — nenhum byte de contribuinte
       sai do browser (LGPD por construção).
    2. Dispara download local.
    3. Chama o MSW registrando a intenção de export com o mesmo
       `correlationId`, preservando cadeia de custódia (pattern
       igual ao dossiê T28 · ADR-0004).
*/

export type GenerateReportInput = {
  data: ReportData;
  formato: RelatorioFormato;
  actor: {
    id: string;
    displayName: string;
    role: string;
  };
};

export type GenerateReportResult = {
  filename: string;
  response: RelatorioGerencialResponse;
};

async function buildPdfBlob(data: ReportData): Promise<Blob> {
  /*
    Dynamic imports — mesma justificativa do dossiê (ADR-0004): a
    lib @react-pdf/renderer (~500 KB gz) só é baixada quando o
    usuário clica em "Gerar PDF".
  */
  const [{ pdf }, { GerencialPdfReport }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./pdf-report"),
  ]);
  const instance = pdf(<GerencialPdfReport data={data} />);
  return await instance.toBlob();
}

function slug(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportResult> {
  const { data, formato, actor } = input;
  const filename = `${data.tipo}-${slug(data.periodo.inicio)}-${slug(data.periodo.fim)}.${formato}`;

  const blob = formato === "xlsx" ? await generateXlsxBlob(data) : await buildPdfBlob(data);
  downloadBlob(filename, blob);

  const { apiRequest } = await import("@/lib/api-client");
  const requestBody: RelatorioGerencialRequest = {
    tipo: data.tipo,
    formato,
    periodo: data.periodo,
    secoes: [...data.secoes],
    correlationId: data.correlationId,
  };
  const response = await apiRequest<RelatorioGerencialResponse>("/analytics/reports/generate", {
    method: "POST",
    body: requestBody,
    headers: {
      "X-Actor-Role": actor.role,
      "X-Actor-Id": actor.id,
      "X-Actor-Name": actor.displayName,
    },
  });
  return { filename, response };
}

export function newReportCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cid-rel-${crypto.randomUUID()}`;
  }
  return `cid-rel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
