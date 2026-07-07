"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Route } from "next";
import Link from "next/link";
import { useMemo } from "react";

import type { NivelRisco, RiskQueueItem, SituacaoCadastral } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyBRL } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

/*
  Tabela da fila priorizada de contribuintes (T08 · módulo 3 · RF03/FA03).
  Os itens já chegam ordenados por score desc pelo Agente de Score — a
  coluna "posição" reflete a ordem recebida (pós-filtro); o front nunca
  re-prioriza. O CTA "Visão 360" leva ao dossiê do contribuinte, onde o
  auditor decide o tratamento (human-in-the-loop, AGENTS.md §1.1).
*/

const SITUACAO_LABEL: Record<SituacaoCadastral, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  baixada: "Baixada",
  inapta: "Inapta",
  nula: "Nula",
};

/* Rótulo curto no pill — o nível já é redundante com o score-chip ao lado. */
const NIVEL_SHORT_LABEL: Record<NivelRisco, string> = {
  conforme: "Conforme",
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
  critico: "Crítico",
};

/*
  Score-chip do DS v2.0 §8: retângulo 42×30 com fundo tingido pelo nível
  (mesma técnica de color-mix do StatusBadge) e numeral Montserrat 15/700.
  Texto usa os tokens --c-risk-N-txt para garantir contraste ≥ 4.5:1.
*/
const SCORE_CHIP_CLASSES: Record<NivelRisco, string> = {
  conforme:
    "bg-[color-mix(in_srgb,var(--c-risk-1)_14%,var(--surface))] text-[color:var(--c-risk-1-txt)]",
  baixo:
    "bg-[color-mix(in_srgb,var(--c-risk-2)_16%,var(--surface))] text-[color:var(--c-risk-2-txt)]",
  medio:
    "bg-[color-mix(in_srgb,var(--c-risk-3)_18%,var(--surface))] text-[color:var(--c-risk-3-txt)]",
  alto: "bg-[color-mix(in_srgb,var(--c-risk-4)_16%,var(--surface))] text-[color:var(--c-risk-4-txt)]",
  critico:
    "bg-[color-mix(in_srgb,var(--c-risk-5)_14%,var(--surface))] text-[color:var(--c-risk-5-txt)]",
};

type RiskQueueTableProps = {
  items: RiskQueueItem[];
};

export function RiskQueueTable({ items }: RiskQueueTableProps) {
  const columns = useMemo<ColumnDef<RiskQueueItem>[]>(
    () => [
      {
        id: "posicao",
        header: "Posição",
        cell: ({ row }) => (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-050 font-data text-xs font-bold text-brand-deep">
            {row.index + 1}
          </span>
        ),
      },
      {
        id: "contribuinte",
        // Razão social + CNPJ no mesmo accessor para a busca global cobrir ambos.
        accessorFn: (item) => `${item.razaoSocial} ${item.cnpjMascarado}`,
        header: "Contribuinte",
        cell: ({ row }) => (
          <div className="min-w-0 max-w-[16rem]">
            {/* line-clamp em vez de truncate: quebra na vertical sem forçar
                largura mínima na tabela. */}
            <p
              className="line-clamp-2 break-words text-sm font-medium text-text-strong"
              title={row.original.razaoSocial}
              data-sensitive
            >
              {row.original.razaoSocial}
            </p>
            <p className="flex items-center gap-2 font-data text-xs text-muted-foreground">
              <span data-sensitive>{row.original.cnpjMascarado}</span>
              {/* Situação embutida — só chama atenção quando NÃO está ativa. */}
              {row.original.situacao !== "ativa" ? (
                <span className="font-sans font-medium text-[color:var(--c-risk-4-txt)]">
                  {SITUACAO_LABEL[row.original.situacao]}
                </span>
              ) : null}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "scoreValor",
        header: "Score",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-[30px] w-[42px] shrink-0 items-center justify-center rounded-lg font-data text-[15px] font-bold",
                SCORE_CHIP_CLASSES[row.original.nivel],
              )}
            >
              {row.original.scoreValor}
            </span>
            <StatusBadge
              kind="risk"
              level={row.original.nivel}
              label={NIVEL_SHORT_LABEL[row.original.nivel]}
            />
          </div>
        ),
      },
      {
        accessorKey: "valorPotencial",
        header: "Valor potencial",
        meta: { className: "hidden lg:table-cell" },
        cell: ({ getValue }) => (
          <span className="font-data text-sm text-text-strong">
            {formatCurrencyBRL(getValue<number | undefined>())}
          </span>
        ),
      },
      {
        accessorKey: "setor",
        header: "Setor",
        meta: { className: "hidden xl:table-cell" },
        cell: ({ getValue }) => {
          const setor = getValue<string | undefined>();
          // Quebra em até 2 linhas em vez de forçar largura mínima na tabela.
          return setor ? (
            <span
              className="line-clamp-2 max-w-[12rem] text-xs text-muted-foreground"
              title={setor}
            >
              {setor}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "statusTratamento",
        header: "Tratamento",
        cell: ({ row }) => {
          const status = row.original.statusTratamento;
          return status === "sem_tratamento" ? (
            <StatusBadge kind="manual" tone="neutral" label="Sem tratamento" />
          ) : (
            <StatusBadge kind="status" status={status} />
          );
        },
      },
      {
        id: "acao",
        header: "Ação",
        cell: ({ row }) => (
          <Button size="xs" variant="secondary" asChild>
            <Link
              href={`/fila-de-risco/${row.original.contribuinteId}` as Route}
              aria-label={`Abrir visão 360 do contribuinte ${row.original.razaoSocial}`}
            >
              Visão 360
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      searchable
      searchPlaceholder="Buscar por razão social, CNPJ…"
      emptyMessage="Nenhum contribuinte corresponde aos filtros aplicados."
    />
  );
}
