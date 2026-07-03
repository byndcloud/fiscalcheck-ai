"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { AuditableAction } from "@fiscalcheck/shared-types";

import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";

const DATE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

export default function CompliancePage() {
  const query = useQuery({
    queryKey: ["compliance", "audit-log"],
    queryFn: () => apiRequest<AuditableAction[]>("/compliance/audit-log"),
  });

  const columns = useMemo<ColumnDef<AuditableAction>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "Quando",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{DATE.format(new Date(getValue<string>()))}</span>
        ),
      },
      { accessorKey: "action", header: "Ação" },
      {
        accessorKey: "actor_id",
        header: "Ator",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "correlation_id",
        header: "Correlation ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">{getValue<string>()}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Governança e conformidade"
        description="Trilha de auditoria imutável, controle de acesso e evidências LGPD. Módulo 6."
      />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando trilha…</p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data ?? []}
          searchable
          searchPlaceholder="Buscar por ação, ator, correlation id…"
          emptyMessage="Sem eventos no período."
        />
      )}
    </div>
  );
}
