"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRightIcon } from "lucide-react";
import { useMemo } from "react";

import type {
  CanalComunicacao,
  Comunicacao,
  Contribuinte,
  StatusComunicacao,
} from "@fiscalcheck/shared-types";

import { ChannelIcon } from "@/components/communications/channel-icon";
import {
  STATUS_LABEL_PT,
  STATUS_TONE,
  StatusStepper,
} from "@/components/communications/status-stepper";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

/*
  Lista de comunicações (T15). Colunas:
   - Protocolo (font-mono)
   - Caso vinculado (font-mono + razão social do contribuinte)
   - Canal (ícone + label)
   - Stepper compacto (rastreio visual)
   - Status badge (tom semântico)
   - Enviada em (data curta)
   - Prazo (colorido se vencendo)
   - Ação: "Abrir dossiê" → chama onSelect
*/

type Props = {
  data: Comunicacao[];
  taxpayerById: Map<string, Contribuinte>;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

function formatShort(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })} · ${d.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

function prazoTone(prazo?: string): { toneClass: string; suffix: string } {
  if (!prazo) return { toneClass: "text-muted-foreground", suffix: "" };
  const diffMs = new Date(prazo).getTime() - Date.now();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 0) return { toneClass: "text-[color:var(--c-risk-5)]", suffix: "vencido" };
  if (diffH < 24) return { toneClass: "text-[color:var(--c-risk-4)]", suffix: "vence em <24h" };
  if (diffH < 72) return { toneClass: "text-[color:var(--c-risk-3)]", suffix: "vence em 3d" };
  return { toneClass: "text-muted-foreground", suffix: "" };
}

export function CommunicationsList({ data, taxpayerById, onSelect, emptyMessage }: Props) {
  const columns = useMemo<ColumnDef<Comunicacao>[]>(
    () => [
      {
        id: "protocolo",
        header: "Protocolo",
        accessorFn: (row) => row.protocolo,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-semibold text-text-strong">
              {row.original.protocolo}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {row.original.id}
            </span>
          </div>
        ),
      },
      {
        id: "caso",
        header: "Caso · Contribuinte",
        accessorFn: (row) => {
          const tp = taxpayerById.get(row.contribuinteId);
          return `${row.casoId} ${tp?.razaoSocial ?? row.contribuinteId}`;
        },
        cell: ({ row }) => {
          const tp = taxpayerById.get(row.original.contribuinteId);
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs text-brand-deep">
                {row.original.casoId.toUpperCase()}
              </span>
              <span className="text-xs text-foreground">
                {tp?.razaoSocial ?? row.original.contribuinteId}
              </span>
            </div>
          );
        },
      },
      {
        id: "canal",
        header: "Canal",
        accessorFn: (row) => row.canal,
        cell: ({ row }) => <ChannelIcon canal={row.original.canal as CanalComunicacao} showLabel />,
      },
      {
        id: "rastreio",
        header: "Rastreio",
        enableSorting: false,
        cell: ({ row }) => (
          <StatusStepper
            status={row.original.status as StatusComunicacao}
            variant="compact"
            className="w-[220px]"
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <StatusBadge
            kind="manual"
            tone={STATUS_TONE[row.original.status as StatusComunicacao]}
            label={STATUS_LABEL_PT[row.original.status as StatusComunicacao]}
          />
        ),
      },
      {
        id: "enviadaEm",
        header: "Enviada em",
        accessorFn: (row) => row.enviadaEm,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-foreground">
            {formatShort(row.original.enviadaEm)}
          </span>
        ),
      },
      {
        id: "prazo",
        header: "Prazo",
        accessorFn: (row) => row.prazoRespostaEm ?? "",
        cell: ({ row }) => {
          const { toneClass, suffix } = prazoTone(row.original.prazoRespostaEm);
          return (
            <div className="flex flex-col gap-0.5">
              <span className={cn("font-mono text-[11px]", toneClass)}>
                {formatShort(row.original.prazoRespostaEm)}
              </span>
              {suffix ? (
                <span className={cn("text-[10px] font-medium uppercase", toneClass)}>{suffix}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "acao",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onSelect(row.original.id)}
            aria-label={`Abrir detalhes da comunicação ${row.original.protocolo}`}
          >
            Abrir
            <ChevronRightIcon aria-hidden />
          </Button>
        ),
      },
    ],
    [taxpayerById, onSelect],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage ?? "Nenhuma comunicação corresponde aos filtros."}
    />
  );
}
