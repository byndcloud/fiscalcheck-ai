"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
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
  });

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

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando arquivos…</p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data ?? []}
          searchable
          searchPlaceholder="Buscar por nome, fonte…"
          emptyMessage="Nenhum arquivo processado nas últimas 24h."
        />
      )}
    </div>
  );
}
