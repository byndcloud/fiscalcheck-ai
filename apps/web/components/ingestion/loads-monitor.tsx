"use client";

import type { IngestionLoad, IngestionLoadStatus } from "@fiscalcheck/shared-types";
import type { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import { SheetLoadDetails } from "./sheet-load-details";

/*
  Monitor de Cargas — usa DataTable para as colunas contratuais do T04
  (ID em Roboto Mono, Fonte, Registros, % Rejeitados, Status, ação).
  Clicar em "Ver log" abre o drawer com validação e rejeitados.
*/

const NUM_FMT = new Intl.NumberFormat("pt-BR");
const PCT_FMT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const STATUS_META: Record<IngestionLoadStatus, { label: string; className: string }> = {
  recebido: { label: "Recebido", className: "bg-brand-050 text-brand" },
  validando: {
    label: "Validando",
    className: "bg-[color:var(--c-risk-3)]/15 text-[color:var(--c-risk-3)]",
  },
  processado: {
    label: "Processado",
    className: "bg-[color:var(--c-risk-2)]/15 text-[color:var(--c-risk-1)]",
  },
  com_erro: {
    label: "Com erro",
    className: "bg-[color:var(--c-risk-5)]/15 text-[color:var(--c-risk-5)]",
  },
  quarentena: {
    label: "Quarentena",
    className: "bg-[color:var(--c-risk-4)]/15 text-[color:var(--c-risk-4)]",
  },
};

type LoadsMonitorProps = {
  loads: IngestionLoad[];
};

export function LoadsMonitor({ loads }: LoadsMonitorProps) {
  const [selected, setSelected] = useState<IngestionLoad | null>(null);
  const [open, setOpen] = useState(false);

  const openDetails = useCallback((load: IngestionLoad) => {
    setSelected(load);
    setOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<IngestionLoad>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-text-strong">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "fonteNome",
        header: "Fonte",
        cell: ({ getValue }) => (
          <span className="text-sm text-text-strong">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "registros",
        header: "Registros",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{NUM_FMT.format(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "rejeitadosPercent",
        header: "% rejeitados",
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span
              className={cn(
                "font-mono text-sm",
                value >= 2
                  ? "text-[color:var(--c-risk-5)] font-semibold"
                  : value >= 1
                    ? "text-[color:var(--c-risk-3)]"
                    : "text-muted-foreground",
              )}
            >
              {PCT_FMT.format(value / 100)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<IngestionLoadStatus>();
          const meta = STATUS_META[status];
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                meta.className,
              )}
            >
              {meta.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => openDetails(row.original)}
            aria-label={`Ver log da carga ${row.original.id}`}
          >
            <EyeIcon aria-hidden="true" />
            Ver log
          </Button>
        ),
      },
    ],
    [openDetails],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={loads}
        searchable
        searchPlaceholder="Buscar por ID, fonte…"
        emptyMessage="Nenhuma carga processada nas últimas 24h."
      />
      <SheetLoadDetails load={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
