"use client";

import { useQuery } from "@tanstack/react-query";
import { ListOrderedIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import type {
  NivelRisco,
  RegimeTributario,
  RiskQueueItem,
  TipoDivergencia,
} from "@fiscalcheck/shared-types";

import { RiskQueueTable } from "@/components/risk/risk-queue-table";
import { RiskSegmentationPanel } from "@/components/risk/risk-segmentation-panel";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

/*
  Fila priorizada de contribuintes (T08 · módulo 3 · RF03/FA03).
  O Agente de Score ordena por risco; o auditor decide o tratamento
  (AGENTS.md §1.1). Filtros de segmentação aplicados client-side sobre
  a fila já priorizada — a ordem do agente nunca é alterada aqui.
*/

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function RiskQueuePage() {
  const [activeNiveis, setActiveNiveis] = useState<NivelRisco[]>([]);
  const [activeRegimes, setActiveRegimes] = useState<RegimeTributario[]>([]);
  const [activeTipos, setActiveTipos] = useState<TipoDivergencia[]>([]);

  const query = useQuery({
    queryKey: ["ai", "queue"],
    queryFn: () => apiRequest<RiskQueueItem[]>("/ai/queue"),
    meta: { silent: true },
  });

  const items = query.data ?? [];

  const filtered = items.filter(
    (item) =>
      (activeNiveis.length === 0 || activeNiveis.includes(item.nivel)) &&
      (activeRegimes.length === 0 || activeRegimes.includes(item.regime)) &&
      (activeTipos.length === 0 ||
        (item.tipoInconsistencia !== undefined && activeTipos.includes(item.tipoInconsistencia))),
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Fila de risco"
        description="Contribuintes priorizados por score de risco de 0 a 100, calculado a partir dos cruzamentos e do cadastro. O agente ordena a fila; a análise e toda decisão de tratamento são do auditor."
      />

      {/* Rótulo aurora — sinaliza saída de IA, nunca ação fiscal (DS §3.2). */}
      <span
        role="img"
        aria-label="Fila ordenada pelo Agente de Score, uma saída de inteligência artificial"
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[image:var(--grad-aurora)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[var(--e-1)]"
      >
        <SparklesIcon aria-hidden className="size-3" />
        Fila ordenada pelo Agente de Score
      </span>

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={items.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3">
            <SkeletonCard height="h-36" />
            <SkeletonCard height="h-36" />
            <SkeletonCard height="h-36" />
          </div>
        }
        empty={
          <EmptyState
            icon={ListOrderedIcon}
            title="Nenhum contribuinte pontuado"
            description="O Agente de Score ainda não calculou scores para a carteira. Assim que houver contribuintes pontuados, a fila priorizada aparecerá aqui."
          />
        }
      >
        <div className="grid gap-4">
          <RiskSegmentationPanel
            items={items}
            activeNiveis={activeNiveis}
            activeRegimes={activeRegimes}
            activeTipos={activeTipos}
            onToggleNivel={(nivel) => setActiveNiveis((prev) => toggleInList(prev, nivel))}
            onToggleRegime={(regime) => setActiveRegimes((prev) => toggleInList(prev, regime))}
            onToggleTipo={(tipo) => setActiveTipos((prev) => toggleInList(prev, tipo))}
          />
          <RiskQueueTable items={filtered} />
        </div>
      </AsyncBoundary>
    </div>
  );
}
