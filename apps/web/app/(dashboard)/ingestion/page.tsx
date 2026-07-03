"use client";

import type {
  IngestionAgentEvent,
  IngestionLoad,
  IntegrationSource,
  Notificacao,
} from "@fiscalcheck/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AddSourceWizard } from "@/components/ingestion/add-source-wizard";
import { AgentTimeline } from "@/components/ingestion/agent-timeline";
import { LgpdBadge } from "@/components/ingestion/lgpd-badge";
import { LoadsMonitor } from "@/components/ingestion/loads-monitor";
import { SourceCard } from "@/components/ingestion/source-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";

const SOURCE_SKELETON_KEYS = [
  "src-skel-a",
  "src-skel-b",
  "src-skel-c",
  "src-skel-d",
  "src-skel-e",
  "src-skel-f",
] as const;

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl border border-border bg-n-25 ${className ?? "h-32 w-full"}`}
    />
  );
}

/*
  Painel de Integrações (Módulo 1 · T04).

  Estrutura em três seções:
   1. Fontes (SourceCard grid) — status/última carga/volume.
   2. Cargas (LoadsMonitor) + timeline do Agente 24/7 (side panel).
   3. Wizard "Adicionar nova fonte" (mock visual).

  O botão `Simular falha crítica` dispara POST /ingestion/simulate-failure
  e invalida a query de notificações — o sino (T01) atualiza em segundos.
*/

async function fetchSources() {
  return apiRequest<IntegrationSource[]>("/ingestion/sources");
}
async function fetchEvents() {
  return apiRequest<IngestionAgentEvent[]>("/ingestion/agent-events");
}
async function fetchLoads() {
  return apiRequest<IngestionLoad[]>("/ingestion/loads");
}
async function postSimulateFailure(sourceId: string) {
  return apiRequest<Notificacao>("/ingestion/simulate-failure", {
    method: "POST",
    body: { sourceId },
  });
}

export default function IngestionPage() {
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);

  const sourcesQuery = useQuery({ queryKey: ["ingestion", "sources"], queryFn: fetchSources });
  const eventsQuery = useQuery({ queryKey: ["ingestion", "agent-events"], queryFn: fetchEvents });
  const loadsQuery = useQuery({ queryKey: ["ingestion", "loads"], queryFn: fetchLoads });

  const simulateFailure = useMutation({
    mutationFn: postSimulateFailure,
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.warning("Falha crítica sinalizada", {
        description: notification.titulo,
      });
    },
    onError: () => {
      toast.error("Não foi possível simular a falha", {
        description: "Tente novamente em alguns instantes.",
      });
    },
  });

  const failingSource =
    sourcesQuery.data?.find((s) => s.status === "offline" || s.status === "degradado") ??
    sourcesQuery.data?.[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Integrações"
        description="Painel de fontes, cargas e conectores do FiscalCheck AI. Módulo 1 — Ingestão e Qualidade."
        action={
          <>
            <LgpdBadge />
            <Button
              variant="secondary"
              onClick={() => {
                if (!failingSource) return;
                simulateFailure.mutate(failingSource.id);
              }}
              disabled={!failingSource || simulateFailure.isPending}
              aria-label="Simular falha crítica no conector selecionado"
            >
              <AlertTriangleIcon aria-hidden="true" />
              Simular falha crítica
            </Button>
            <Button onClick={() => setWizardOpen(true)}>
              <PlusIcon aria-hidden="true" />
              Adicionar nova fonte
            </Button>
          </>
        }
      />

      <section aria-labelledby="fontes-heading" className="grid gap-3">
        <div className="flex items-end justify-between">
          <div>
            <h2
              id="fontes-heading"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Fontes conectadas
            </h2>
            <p className="text-sm text-text-strong">
              NFS-e, DIMP, ECD, DEFIS, PGDAS-D, cadastro mobiliário e dados abertos.
            </p>
          </div>
          {sourcesQuery.data ? (
            <p className="text-xs text-muted-foreground">
              {sourcesQuery.data.length} fontes ·{" "}
              {sourcesQuery.data.filter((s) => s.status === "online").length} online
            </p>
          ) : null}
        </div>

        {sourcesQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SOURCE_SKELETON_KEYS.map((key) => (
              <SkeletonBlock key={key} className="h-36 w-full" />
            ))}
          </div>
        ) : sourcesQuery.isError ? (
          <p className="text-sm text-destructive">Não foi possível carregar as fontes.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sourcesQuery.data?.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="cargas-heading" className="grid gap-3">
          <div>
            <h2
              id="cargas-heading"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Monitor de cargas
            </h2>
            <p className="text-sm text-text-strong">
              Cargas processadas nas últimas 24h. Clique em "Ver log" para inspecionar validação e
              registros rejeitados.
            </p>
          </div>
          {loadsQuery.isLoading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : loadsQuery.isError ? (
            <p className="text-sm text-destructive">Não foi possível carregar as cargas.</p>
          ) : (
            <LoadsMonitor loads={loadsQuery.data ?? []} />
          )}
        </section>

        <section aria-labelledby="agente-heading" className="grid gap-3">
          <div>
            <h2
              id="agente-heading"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Agente de ingestão · 24/7
            </h2>
            <p className="text-sm text-text-strong">
              ETL, validação, qualidade e pseudonimização em tempo real.
            </p>
          </div>
          {eventsQuery.isLoading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : eventsQuery.isError ? (
            <p className="text-sm text-destructive">Timeline indisponível.</p>
          ) : (
            <AgentTimeline events={eventsQuery.data ?? []} />
          )}
        </section>
      </div>

      <AddSourceWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
