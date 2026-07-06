"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, CreditCardIcon, FileTextIcon, GlobeIcon, RadarIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import type { Caso, FonteIndicio, NonFiler } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

/*
  Aba "Fora do radar" — Non-filer Discovery (T06 · módulo 2 · RF02).
  Fila PRIORIZADA por receita estimada não declarada. Cada linha diz
  QUAL fonte revelou o indício (aceite) e o CTA "Iniciar inscrição de
  ofício" abre um caso candidato real — sempre com confirmação do
  auditor (AGENTS.md §1.1 — human-in-the-loop).
*/

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const FONTE_INDICIO_LABEL: Record<FonteIndicio, string> = {
  nfse_terceiros: "NFS-e de terceiros",
  meios_pagamento: "Meios de pagamento",
  fonte_aberta: "Fonte aberta",
};

const FONTE_ICON: Record<FonteIndicio, typeof FileTextIcon> = {
  nfse_terceiros: FileTextIcon,
  meios_pagamento: CreditCardIcon,
  fonte_aberta: GlobeIcon,
};

type OpenCaseResponse = { nonFiler: NonFiler; caso: Caso };

export function NonFilerTab() {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<NonFiler | null>(null);

  const query = useQuery({
    queryKey: ["crossing", "non-filers"],
    queryFn: () => apiRequest<NonFiler[]>("/crossing/non-filers"),
    meta: { silent: true },
  });

  const openCase = useMutation({
    mutationFn: (nonFilerId: string) =>
      apiRequest<OpenCaseResponse>(`/crossing/non-filers/${nonFilerId}/open-case`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      toast.success(
        `Caso candidato ${data.caso.id.toUpperCase()} aberto — inscrição de ofício encaminhada para instrução.`,
      );
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["crossing", "non-filers"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const fila = query.data ?? [];

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Prestadores identificados por evidências indiretas — NFS-e de terceiros, meios de pagamento
        e fontes abertas — sem cadastro mobiliário nem declaração compatível. Fila priorizada pela
        receita estimada não declarada.
      </p>

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={fila.length === 0}
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
            icon={RadarIcon}
            title="Nenhum prestador fora do radar"
            description="O agente de descoberta não encontrou prestadores sem cadastro com atividade econômica detectável nas fontes monitoradas."
          />
        }
      >
        <ol className="grid gap-3" aria-label="Fila priorizada de prestadores fora do radar">
          {fila.map((nonFiler, index) => (
            <li
              key={nonFiler.id}
              className="rounded-lg border border-border bg-surface p-4 shadow-[var(--e-1)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-050 font-data text-xs font-bold text-brand-deep"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-strong">
                      {nonFiler.nomeIndicado}
                    </p>
                    <p className="font-data text-[11px] text-muted-foreground">
                      {nonFiler.documentoMascarado} · sem inscrição municipal
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {nonFiler.atividadePresumida}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Receita estimada (12m)
                  </p>
                  <p className="font-data text-lg font-bold text-[color:var(--c-risk-4-txt)]">
                    {BRL.format(nonFiler.receitaEstimada12m)}
                  </p>
                </div>
              </div>

              {/* Indícios: qual fonte revelou (aceite T06) */}
              <ul className="mt-3 grid gap-2" aria-label="Indícios e fontes">
                {nonFiler.indicios.map((indicio) => {
                  const Icon = FONTE_ICON[indicio.fonte];
                  return (
                    <li
                      key={`${nonFiler.id}-${indicio.fonte}-${indicio.referencia}`}
                      className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 rounded-[var(--r-md)] border border-border bg-n-25 p-3"
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline">{FONTE_INDICIO_LABEL[indicio.fonte]}</Badge>
                            <AgentRecommendationBadge />
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-foreground">
                            {indicio.resumo}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Evidência: {indicio.referencia}
                          </p>
                        </div>
                      </div>
                      <p className="font-data text-xs font-semibold text-text-strong">
                        {BRL.format(indicio.valorEstimado)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground">
                  Detectado em {new Date(nonFiler.detectadoEm).toLocaleDateString("pt-BR")}
                </p>
                {nonFiler.status === "caso_aberto" && nonFiler.casoId ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/cases?caso=${nonFiler.casoId}`}>
                      Ver caso candidato {nonFiler.casoId.toUpperCase()}
                      <ArrowRightIcon aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => setConfirming(nonFiler)}>
                    Iniciar inscrição de ofício
                  </Button>
                )}
              </footer>
            </li>
          ))}
        </ol>
      </AsyncBoundary>

      {/* Confirmação do auditor — nenhuma ação de ofício sem aprovação humana */}
      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => (!open ? setConfirming(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar inscrição de ofício</DialogTitle>
            <DialogDescription>
              Abre um caso candidato para <strong>{confirming?.nomeIndicado}</strong> com os
              indícios anexados como evidência. A inscrição de ofício e qualquer efeito sobre o
              contribuinte só ocorrem após a instrução e aprovação no fluxo de casos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={openCase.isPending}
              onClick={() => confirming && openCase.mutate(confirming.id)}
            >
              {openCase.isPending ? "Abrindo caso…" : "Confirmar e abrir caso candidato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
