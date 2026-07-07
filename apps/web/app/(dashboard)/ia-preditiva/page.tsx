"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3Icon, SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { Agente, Score } from "@fiscalcheck/shared-types";

import { ScoreFactorsPanel } from "@/components/risk/score-factors-panel";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

const AGENTE_TIPO_LABEL: Record<Agente["tipo"], string> = {
  ingestao: "Ingestão",
  gatekeeper: "Gatekeeper",
  scoring: "Score",
  orquestrador: "Orquestrador",
  copilot: "Copilot",
};

const AGENTE_STATUS_LABEL: Record<Agente["status"], string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  erro: "Erro",
  inicializando: "Inicializando",
};

export default function AiPage() {
  // T09 — score selecionado abre o painel de fatores num Sheet lateral.
  const [explainedScore, setExplainedScore] = useState<Score | null>(null);

  const scores = useQuery({
    queryKey: ["ai", "scores"],
    queryFn: () => apiRequest<Score[]>("/ai/scores"),
  });

  const agentes = useQuery({
    queryKey: ["ai", "agents"],
    queryFn: () => apiRequest<Agente[]>("/ai/agents"),
  });

  const scoreColumns = useMemo<ColumnDef<Score>[]>(
    () => [
      {
        accessorKey: "contribuinteId",
        header: "Contribuinte",
        cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
      },
      {
        accessorKey: "valor",
        header: "Score",
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">{getValue<number>()} / 100</span>
        ),
      },
      {
        accessorKey: "nivel",
        header: "Nível",
        cell: ({ getValue }) => <StatusBadge kind="risk" level={getValue<Score["nivel"]>()} />,
      },
      {
        accessorKey: "modeloVersao",
        header: "Modelo",
      },
      {
        accessorKey: "proximaAcaoRecomendada",
        header: "Próxima ação recomendada",
        cell: ({ getValue }) => (
          <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
            {getValue<string | undefined>() ?? "—"}
          </p>
        ),
      },
      {
        id: "explicabilidade",
        header: "Explicabilidade",
        cell: ({ row }) => (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setExplainedScore(row.original)}
            aria-label={`Ver fatores do score do contribuinte ${row.original.contribuinteId}`}
          >
            <BarChart3Icon aria-hidden className="size-3.5" />
            Ver fatores
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="IA Preditiva"
        description="Scores de risco explicáveis (XAI) e status dos agentes LangGraph. O auditor sempre decide; a IA apenas recomenda."
      />

      {scores.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando scores…</p>
      ) : (
        <DataTable
          columns={scoreColumns}
          data={scores.data ?? []}
          searchable
          searchPlaceholder="Buscar por contribuinte, nível…"
          emptyMessage="Sem scores calculados hoje."
        />
      )}

      <section className="grid gap-3 rounded-lg border border-border bg-surface p-6 shadow-[var(--e-1)]">
        <header className="flex items-center gap-2">
          <SparklesIcon aria-hidden="true" className="size-4 text-brand" />
          <h2 className="text-sm font-semibold text-text-strong">Agentes da plataforma</h2>
        </header>
        {agentes.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando agentes…</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {agentes.data?.map((agente) => (
              <li
                key={agente.id}
                className="rounded-md border border-border/60 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-strong">{agente.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {AGENTE_TIPO_LABEL[agente.tipo]}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-medium uppercase tracking-wide"
                    data-status={agente.status}
                  >
                    {AGENTE_STATUS_LABEL[agente.status]}
                  </span>
                </div>
                {agente.descricao ? (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {agente.descricao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet
        open={explainedScore !== null}
        onOpenChange={(next) => (!next ? setExplainedScore(null) : undefined)}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {explainedScore ? (
            <div className="flex flex-col gap-4 p-2">
              <SheetHeader className="gap-1 p-0">
                <SheetTitle>Por que este score?</SheetTitle>
                <SheetDescription>
                  Contribuinte{" "}
                  <span className="font-mono uppercase">{explainedScore.contribuinteId}</span> ·
                  fatores que compõem a classificação de risco (RF03).
                </SheetDescription>
              </SheetHeader>
              <ScoreFactorsPanel score={explainedScore} />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
