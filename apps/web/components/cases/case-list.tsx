"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightIcon } from "lucide-react";
import { useMemo } from "react";

import type { Caso, Contribuinte } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { prazoInfo } from "@/lib/prazo";
import { cn } from "@/lib/utils";

/*
  Lista de casos — DataTable com filtro externo (via toolbar da página),
  ordenação por prazo e score, e ação "Abrir dossiê" alinhada com o
  Kanban (mesmo handler).
*/

const RECOMENDACAO_LABEL: Record<string, string> = {
  intimacao: "Intimação",
  autorregularizacao: "Autorregularização",
  fiscalizacao: "Fiscalização",
};

const CURRENCY_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Props = {
  data: Caso[];
  taxpayerById?: Map<string, Contribuinte>;
  onOpenDossie: (id: string) => void;
};

export function CaseList({ data, taxpayerById, onOpenDossie }: Props) {
  const columns = useMemo<ColumnDef<Caso>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-text-strong">
            {String(row.getValue("id")).toUpperCase()}
          </span>
        ),
      },
      {
        id: "contribuinte",
        header: "Contribuinte",
        cell: ({ row }) => {
          const taxpayer = taxpayerById?.get(row.original.contribuinteId);
          return (
            <div className="flex flex-col text-xs">
              <span className="font-medium text-foreground">
                {taxpayer?.nomeFantasia ?? taxpayer?.razaoSocial ?? row.original.contribuinteId}
              </span>
              {taxpayer ? (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {taxpayer.cnpjMascarado}
                </span>
              ) : null}
            </div>
          );
        },
        sortingFn: (a, b) => {
          const nameA =
            taxpayerById?.get(a.original.contribuinteId)?.razaoSocial ?? a.original.contribuinteId;
          const nameB =
            taxpayerById?.get(b.original.contribuinteId)?.razaoSocial ?? b.original.contribuinteId;
          return nameA.localeCompare(nameB, "pt-BR");
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StatusBadge kind="status" status={row.original.status} />
            {row.original.agenteResponsavel ? (
              <AgentRecommendationBadge className="hidden md:inline-flex" />
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "scoreValor",
        header: "Score",
        cell: ({ row }) => {
          const score = row.original.scoreValor ?? 0;
          return <span className="font-mono text-sm text-foreground">{score}</span>;
        },
        sortingFn: (a, b) => (a.original.scoreValor ?? 0) - (b.original.scoreValor ?? 0),
      },
      {
        accessorKey: "valorPotencial",
        header: "Potencial",
        cell: ({ row }) => {
          const v = row.original.valorPotencial;
          return v ? (
            <span className="font-mono text-xs text-text-strong">{CURRENCY_BRL.format(v)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
        sortingFn: (a, b) => (a.original.valorPotencial ?? 0) - (b.original.valorPotencial ?? 0),
      },
      {
        accessorKey: "prazoLimite",
        header: "Prazo",
        // T14: prazos vencidos/críticos destacados também na Lista (aceite).
        cell: ({ row }) => {
          const prazo = row.original.prazoLimite;
          if (!prazo) return <span className="text-xs text-muted-foreground">—</span>;
          const info = prazoInfo(prazo);
          return (
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xs font-semibold",
                  info.tone === "danger"
                    ? "text-[color:var(--c-risk-5-txt)]"
                    : info.tone === "warn"
                      ? "text-[color:var(--c-risk-3-txt)]"
                      : "text-muted-foreground",
                )}
              >
                {info.label}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(`${prazo}T12:00:00`).toLocaleDateString("pt-BR")}
              </span>
            </div>
          );
        },
        sortingFn: (a, b) => {
          const av = a.original.prazoLimite ?? "";
          const bv = b.original.prazoLimite ?? "";
          return av.localeCompare(bv);
        },
      },
      {
        id: "recomendacao",
        header: "Ação recomendada",
        cell: ({ row }) => {
          const acao = row.original.recomendacao?.acao;
          if (!acao) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <span className="text-xs text-foreground">{RECOMENDACAO_LABEL[acao] ?? acao}</span>
          );
        },
      },
      {
        id: "acoes",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="xs" onClick={() => onOpenDossie(row.original.id)}>
            Abrir dossiê
            <ArrowRightIcon aria-hidden />
          </Button>
        ),
      },
    ],
    [onOpenDossie, taxpayerById],
  );

  return <DataTable data={data} columns={columns} emptyMessage="Nenhum caso encontrado." />;
}
