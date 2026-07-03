"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { Caso } from "@fiscalcheck/shared-types";

import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export default function CasesPage() {
  const query = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
  });

  const columns = useMemo<ColumnDef<Caso>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Caso",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "contribuinteId",
        header: "Contribuinte",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <StatusBadge kind="status" status={getValue<Caso["status"]>()} />,
      },
      {
        accessorKey: "scoreValor",
        header: "Score",
        cell: ({ getValue }) => {
          const v = getValue<number | undefined>();
          return v == null ? "—" : <span className="font-mono">{v}/100</span>;
        },
      },
      {
        accessorKey: "prazoLimite",
        header: "Prazo",
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          return v ? DATE.format(new Date(v)) : "—";
        },
      },
      {
        accessorKey: "proximaAcaoRecomendada",
        header: "Próxima ação",
        cell: ({ getValue }) => (
          <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
            {getValue<string | undefined>() ?? "—"}
          </p>
        ),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Gestão de casos"
        description="Casos de fiscalização em andamento com prazo, status e próxima ação recomendada. Módulo 4."
      />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando casos…</p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data ?? []}
          searchable
          searchPlaceholder="Buscar por caso, contribuinte…"
          emptyMessage="Nenhum caso aberto."
        />
      )}
    </div>
  );
}
