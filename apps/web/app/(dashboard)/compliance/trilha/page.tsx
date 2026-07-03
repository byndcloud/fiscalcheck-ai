"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, ArrowLeftIcon, Loader2Icon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { AuditLogEntry } from "@fiscalcheck/shared-types";

import { AuditLogDetailSheet } from "@/components/compliance/audit-log-detail-sheet";
import { AuditLogTable } from "@/components/compliance/audit-log-table";
import {
  AUDIT_FILTERS_DEFAULT,
  type AuditFilters,
  AuditLogToolbar,
} from "@/components/compliance/audit-log-toolbar";
import { SigiloBanner } from "@/components/compliance/sigilo-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiRequest } from "@/lib/api-client";
import { type ExportFormat, exportAuditEntries } from "@/lib/compliance/export-audit";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { useSession } from "@/stores/session-store";

/*
  Página /compliance/trilha (T19 · módulo 6, ADMIN ONLY).

  Trilha completa com filtros no cliente + export CSV/JSON. Toolbar
  não faz refetch a cada digitação — só quando `q` estabiliza para
  não estourar a API mock. Filtragem por papel/resultado/atypical
  acontece client-side sobre o resultado; o `q` também é debounced
  cliente-side.
*/

export default function CompliancesTrilhaPage() {
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const auditQuery = useQuery({
    queryKey: ["compliance", "audit-log-v2", { view: "trilha" }],
    queryFn: () => apiRequest<AuditLogEntry[]>("/compliance/audit-log-v2"),
    enabled: isAdmin,
  });

  const [filters, setFilters] = useState<AuditFilters>(AUDIT_FILTERS_DEFAULT);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const filtered = useMemo(() => {
    if (!auditQuery.data) return [];
    const q = filters.q.trim().toLowerCase();
    return auditQuery.data.filter((entry) => {
      if (filters.role !== "todos" && entry.actorRole !== filters.role) return false;
      if (filters.result !== "todos" && entry.result !== filters.result) return false;
      if (filters.atypicalOnly && !entry.atypical) return false;
      if (filters.from) {
        const fromISO = new Date(`${filters.from}T00:00:00Z`).toISOString();
        if (entry.timestamp < fromISO) return false;
      }
      if (filters.to) {
        const toISO = new Date(`${filters.to}T23:59:59Z`).toISOString();
        if (entry.timestamp > toISO) return false;
      }
      if (q) {
        const haystack = [
          entry.id,
          entry.actorName,
          entry.actorId,
          entry.action,
          entry.resource,
          entry.ipAddress,
          entry.details,
          entry.dadosAcessados ?? "",
          entry.atypicalReason ?? "",
          entry.correlationId,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [auditQuery.data, filters]);

  const registerExport = useMutation({
    mutationFn: async ({ format, total }: { format: ExportFormat; total: number }) => {
      return apiRequest("/compliance/audit-log-v2/export", {
        method: "POST",
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": user?.id ?? "mock-admin",
          "X-Actor-Name": user?.displayName ?? "Administrador",
        },
        body: { format, total },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
    },
  });

  const handleExport = async (format: ExportFormat) => {
    const { total, filename } = exportAuditEntries(filtered, format);
    try {
      await registerExport.mutateAsync({ format, total });
      toast.success(`Trilha exportada (${filename}). Evento registrado na própria trilha.`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao registrar export.";
      toast.error(message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="grid gap-5">
        <PageHeader
          title="Trilha de auditoria"
          description="Log imutável de todas as ações relevantes na plataforma."
        />
        <ForbiddenNotice roleLabel={role ? ROLE_LABEL_PT[role] : "Perfil desconhecido"} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Trilha de auditoria"
        description="Log imutável (append-only) de todas as ações relevantes. Filtros no cliente, export CSV/JSON registrado na própria trilha. Módulo 6."
        action={
          <Link
            href="/compliance"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:underline"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            Voltar à visão geral
          </Link>
        }
      />

      <SigiloBanner />

      {auditQuery.isLoading ? (
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-[var(--r-md)] border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
        >
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
          Carregando trilha…
        </output>
      ) : auditQuery.isError ? (
        <ErrorNotice onRetry={() => auditQuery.refetch()} />
      ) : (
        <>
          <AuditLogToolbar
            filters={filters}
            onChange={setFilters}
            total={filtered.length}
            onExport={handleExport}
            isExporting={registerExport.isPending}
          />

          <AuditLogTable entries={filtered} onSelect={setSelected} />
        </>
      )}

      <AuditLogDetailSheet
        entry={selected}
        onOpenChange={(open) => (!open ? setSelected(null) : null)}
      />
    </div>
  );
}

function ForbiddenNotice({ roleLabel }: { roleLabel: string }) {
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title="Área restrita ao Administrador"
      description={`O perfil atual (${roleLabel}) não tem permissão para visualizar a trilha completa. Peça acesso ao Admin.`}
    />
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--r-md)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-5" />
        <div className="grid gap-1">
          <p className="font-semibold">Não foi possível carregar a trilha.</p>
          <p className="text-xs">
            Verifique sua conexão com a API mock e tente novamente. Nenhum dado foi alterado.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
