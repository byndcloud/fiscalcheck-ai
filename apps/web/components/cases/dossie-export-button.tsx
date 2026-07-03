"use client";

import { useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  CaseDecision,
  CaseDocument,
  Caso,
  Contribuinte,
  Divergencia,
  NFSe,
  Score,
} from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { buildDossieData } from "@/lib/dossie/build-dossie-data";
import { exportDossieToPdf, newDossieCorrelationId } from "@/lib/dossie/export-dossie";
import { useSession } from "@/stores/session-store";

/*
  Botão "Exportar PDF" no header do dossiê (T28 · módulo 4).

  Estados:
  - idle: pronto para exportar
  - generating: gerando o PDF client-side + subindo o evento à trilha
  - success/error: toast do Sonner

  RBAC: escondido para cidadão (guard do lado do server-mock também).
*/

const LOGO_SRC = "/brand/logo-horizontal.png";

const ROLE_LABEL: Record<string, string> = {
  auditor: "Auditor Fiscal",
  supervisor: "Gestor Supervisor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};

type Props = {
  caso: Caso;
  contribuinte: Contribuinte | null;
  score: Score | null;
  divergencias: Divergencia[];
  evidencias: NFSe[];
  decisions: CaseDecision[];
  documents: CaseDocument[];
  disabled?: boolean;
};

export function DossieExportButton({
  caso,
  contribuinte,
  score,
  divergencias,
  evidencias,
  decisions,
  documents,
  disabled,
}: Props) {
  const queryClient = useQueryClient();
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const [generating, setGenerating] = useState(false);

  const canExport = role === "auditor" || role === "supervisor" || role === "admin";
  if (!canExport) return null;

  const handleExport = async () => {
    if (generating) return;
    setGenerating(true);
    const dismissPending = toast.loading("Gerando dossiê em PDF…", {
      description: `Caso ${caso.id.toUpperCase()} · peça sob sigilo fiscal`,
    });
    try {
      const correlationId = newDossieCorrelationId();
      const now = new Date();

      const data = buildDossieData({
        caso,
        contribuinte,
        score,
        divergencias,
        evidencias,
        decisions,
        documents,
        auditor: {
          displayName: user?.displayName ?? ROLE_LABEL[role] ?? "Auditor Fiscal",
          role: ROLE_LABEL[role] ?? role,
        },
        correlationId,
        now,
      });

      const { filename, entry } = await exportDossieToPdf({
        data,
        caseId: caso.id,
        logoSrc: LOGO_SRC,
        actor: {
          role,
          id: user?.id ?? `mock-${role}`,
          displayName: user?.displayName ?? ROLE_LABEL[role] ?? "Auditor Fiscal",
        },
      });

      toast.dismiss(dismissPending);
      toast.success("Dossiê exportado", {
        description: `${filename} — registrado na trilha (${entry.id}).`,
      });

      /*
        Invalida a trilha para o Admin ver o evento sem refresh manual.
        Não invalida "cases" pois o caso em si não muda de estado.
      */
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
    } catch (error) {
      toast.dismiss(dismissPending);
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao exportar o dossiê.";
      toast.error("Não foi possível gerar o PDF", { description: message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleExport}
      disabled={disabled || generating}
      aria-busy={generating}
    >
      {generating ? (
        <Loader2Icon aria-hidden className="animate-spin" />
      ) : (
        <DownloadIcon aria-hidden />
      )}
      {generating ? "Gerando PDF…" : "Exportar PDF"}
    </Button>
  );
}
