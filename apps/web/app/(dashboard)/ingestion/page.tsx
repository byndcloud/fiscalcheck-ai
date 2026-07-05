"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";
import { useMemo } from "react";

import { AsyncBoundary } from "@/components/ui/async-boundary";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonTable } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import type { ArquivoIngerido } from "@/mocks/fixtures/arquivos";

const STATUS_LABEL: Record<ArquivoIngerido["status"], string> = {
  recebido: "Recebido",
  validando: "Validando",
  processado: "Processado",
  com_erro: "Com erro",
  quarentena: "Quarentena",
};

const BYTES_FMT = new Intl.NumberFormat("pt-BR");
function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function IngestionPage() {
  const query = useQuery({
    queryKey: ["ingestion", "files"],
    queryFn: () => apiRequest<ArquivoIngerido[]>("/ingestion/files"),
    // T25: erro dessa query já é sinalizado inline pelo AsyncBoundary;
    // evita toast global duplicado quando o próprio bloco mostra o retry.
    meta: { silent: true },
  });

  const files = query.data ?? [];

  const columns = useMemo<ColumnDef<ArquivoIngerido>[]>(
    () => [
      { accessorKey: "nome", header: "Arquivo" },
      { accessorKey: "fonte", header: "Fonte" },
      {
        accessorKey: "linhas",
        header: "Linhas",
        cell: ({ getValue }) => (
          <span className="font-mono">{BYTES_FMT.format(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "tamanhoBytes",
        header: "Tamanho",
        cell: ({ getValue }) => <span className="font-mono">{humanBytes(getValue<number>())}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => STATUS_LABEL[getValue<ArquivoIngerido["status"]>()],
      },
      {
        accessorKey: "erros",
        header: "Erros",
        cell: ({ getValue }) => <span className="font-mono">{getValue<number>()}</span>,
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Ingestão e qualidade"
        description="Recebimento e validação de arquivos oficiais (NFS-e, DIMP, ECD, DEFIS, PGDAS e cadastro mobiliário). Módulo 1 do FiscalCheck AI."
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={files.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={<SkeletonTable rows={6} columns={6} />}
        empty={
          <EmptyState
            icon={InboxIcon}
            title="Nenhum arquivo processado nas últimas 24h"
            description="Assim que uma nova ingestão de NFS-e, DIMP, ECD, DEFIS, PGDAS ou cadastro mobiliário chegar, os arquivos aparecerão aqui."
          />
        }
      >
        <DataTable
          columns={columns}
          data={files}
          searchable
          searchPlaceholder="Buscar por nome, fonte…"
          emptyMessage="Nenhum arquivo corresponde ao filtro atual."
        />
      </AsyncBoundary>
    </div>
  );
}
