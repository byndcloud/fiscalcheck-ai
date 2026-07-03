import type { DossieExportResponse } from "@fiscalcheck/shared-types";

import { downloadBlob } from "@/lib/compliance/export-audit";

import type { DossieData } from "./build-dossie-data";

/*
  Orquestrador do export do dossiê em PDF (T28 · módulo 4).

  Fluxo:
  1. Import dinâmico do documento React-PDF (isola o bundle da lib
     — a lib só é baixada quando o auditor efetivamente clica).
  2. Gera o Blob 100% no browser (nenhum dado sensível sai do
     device do auditor — LGPD por construção).
  3. Dispara o download via `downloadBlob` (reuso do padrão T19).
  4. Registra o evento na trilha via POST /cases/:id/dossie/export
     — o mesmo correlationId é impresso no PDF e persistido na
     trilha, fechando a cadeia de custódia.
*/

export type ExportDossieInput = {
  data: DossieData;
  caseId: string;
  logoSrc: string;
  actor: {
    role: string;
    id: string;
    displayName: string;
  };
};

export type ExportDossieResult = {
  filename: string;
  entry: DossieExportResponse["entry"];
};

function timestampSlug(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

async function generatePdfBlob({
  data,
  logoSrc,
}: {
  data: DossieData;
  logoSrc: string;
}): Promise<Blob> {
  /*
    Dynamic imports — evita que `@react-pdf/renderer` (500 KB gz)
    entre no bundle das outras rotas. Só carrega quando o botão é
    clicado.
  */
  const [{ pdf }, { DossiePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./pdf-document"),
  ]);

  const instance = pdf(<DossiePdfDocument data={data} logoSrc={logoSrc} />);
  return await instance.toBlob();
}

export async function exportDossieToPdf(input: ExportDossieInput): Promise<ExportDossieResult> {
  const { data, caseId, logoSrc, actor } = input;
  const filename = `dossie-${caseId.toLowerCase()}-${timestampSlug()}.pdf`;

  const blob = await generatePdfBlob({ data, logoSrc });
  downloadBlob(filename, blob);

  /*
    Import dinâmico do apiRequest só para manter simetria — o client
    já está no bundle base, mas mantemos o `await import` dentro
    deste orquestrador para que o botão consumidor não precise
    conhecer o api-client.
  */
  const { apiRequest } = await import("@/lib/api-client");

  const entryResponse = await apiRequest<DossieExportResponse>(`/cases/${caseId}/dossie/export`, {
    method: "POST",
    body: {
      format: "pdf",
      correlationId: data.correlationId,
      totalDivergencias: data.divergencias.length,
      scoreValor: data.score?.valor,
    },
    headers: {
      "X-Actor-Role": actor.role,
      "X-Actor-Id": actor.id,
      "X-Actor-Name": actor.displayName,
    },
  });

  return { filename, entry: entryResponse.entry };
}

/*
  Correlation id feito no cliente ANTES da geração do Blob, para que
  o mesmo id seja impresso no PDF e persistido na trilha — a
  auditoria consegue amarrar o arquivo em mãos ao registro
  auditável.
*/
export function newDossieCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cid-dossie-${crypto.randomUUID()}`;
  }
  return `cid-dossie-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
