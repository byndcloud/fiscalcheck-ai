"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import type { Divergencia } from "@fiscalcheck/shared-types";

import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const TIPO_LABEL: Record<Divergencia["tipo"], string> = {
  subdeclaracao: "Subdeclaração",
  omissao: "Omissão",
  regime_incorreto: "Regime incorreto",
  endereco_inconsistente: "Endereço inconsistente",
  socio_vinculado: "Sócio vinculado",
};

type NivelRiscoUI = "conforme" | "baixo" | "medio" | "alto" | "critico";

function severidadeToLevel(severidade: number): NivelRiscoUI {
  const clamped = Math.max(1, Math.min(5, Math.round(severidade)));
  return (["conforme", "baixo", "medio", "alto", "critico"] as const)[clamped - 1] as NivelRiscoUI;
}

export default function CrossingPage() {
  const query = useQuery({
    queryKey: ["crossing", "divergences"],
    queryFn: () => apiRequest<Divergencia[]>("/crossing/divergences"),
  });

  const columns = useMemo<ColumnDef<Divergencia>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "contribuinteId",
        header: "Contribuinte",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ getValue }) => TIPO_LABEL[getValue<Divergencia["tipo"]>()],
      },
      {
        accessorKey: "severidade",
        header: "Severidade",
        cell: ({ getValue }) => {
          const s = getValue<Divergencia["severidade"]>();
          return <StatusBadge kind="risk" level={severidadeToLevel(s)} />;
        },
      },
      {
        accessorKey: "valor",
        header: "Valor",
        cell: ({ getValue }) => {
          const v = getValue<number | null | undefined>();
          return v == null ? "—" : <span className="font-mono">{BRL.format(v)}</span>;
        },
      },
      {
        accessorKey: "descricao",
        header: "Descrição",
        cell: ({ getValue }) => (
          <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
            {getValue<string>()}
          </p>
        ),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Detecção e cruzamento"
        description="Divergências entre valores declarados e NFS-e emitidas, com evidências de grafo (sócios, endereços). Módulo 2."
      />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando divergências…</p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data ?? []}
          searchable
          searchPlaceholder="Buscar por contribuinte, tipo…"
          emptyMessage="Nenhuma divergência aberta."
        />
      )}
    </div>
  );
}
