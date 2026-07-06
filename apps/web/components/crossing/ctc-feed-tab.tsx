"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  RadioIcon,
  TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import type { CtcFeed } from "@fiscalcheck/shared-types";

import { AsyncBoundary } from "@/components/ui/async-boundary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/*
  Feed de Monitoramento Contínuo CTC (T07 · módulo 2 · RF09/FA10).
  Atualiza sozinho (refetchInterval): cada lote de NFS-e passa por
  regras + scoring incremental. Item alertado mostra A REGRA que
  disparou e a janela "fato gerador → detecção" (aceites). O convite à
  autorregularização é apenas SUGERIDO pelo auditor — abre caso
  candidato no módulo 4, nunca notifica o contribuinte direto.
*/

const REFRESH_MS = 5_000;

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const HORA = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type SuggestResponse = { alertaId: string; casoId: string };

export function CtcFeedTab() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["crossing", "ctc-feed"],
    queryFn: () => apiRequest<CtcFeed>("/crossing/ctc/feed"),
    refetchInterval: REFRESH_MS,
    meta: { silent: true },
  });

  const suggest = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest<SuggestResponse>(`/crossing/ctc/alerts/${alertId}/suggest`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      toast.success(
        `Convite à autorregularização sugerido — caso candidato ${data.casoId.toUpperCase()} aberto para instrução.`,
      );
      queryClient.invalidateQueries({ queryKey: ["crossing", "ctc-feed"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });

  const feed = query.data;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          NFS-e chegando em fluxo: cada lote recebe regras e scoring incremental. O feed atualiza
          automaticamente a cada {REFRESH_MS / 1000} segundos.
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-100 bg-brand-050 px-2.5 py-1 text-[11px] font-semibold text-brand-deep">
          <RadioIcon aria-hidden="true" className="size-3.5 animate-pulse" />
          Ao vivo
          {feed ? ` · ${HORA.format(new Date(feed.atualizadoEm))}` : null}
        </span>
      </div>

      {/* Contadores da janela corrente */}
      {feed ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContadorCard rotulo="Lotes na janela" valor={String(feed.lotes.length)} />
          <ContadorCard rotulo="NFS-e processadas" valor={String(feed.totalNotas)} />
          <ContadorCard
            rotulo="Alertas antecipados"
            valor={String(feed.totalAlertas)}
            destaque={feed.totalAlertas > 0}
          />
          <ContadorCard
            rotulo="Fato gerador → detecção"
            valor={`${feed.janelaMediaMinutos} min`}
            icone={TimerIcon}
          />
        </div>
      ) : null}

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={(feed?.lotes.length ?? 0) === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3">
            <SkeletonCard height="h-20" />
            <SkeletonCard height="h-20" />
            <SkeletonCard height="h-20" />
          </div>
        }
        empty={
          <EmptyState
            icon={ActivityIcon}
            title="Nenhum lote na janela de monitoramento"
            description="Assim que novas NFS-e chegarem ao fluxo contínuo, os lotes avaliados aparecerão aqui."
          />
        }
      >
        <ol className="grid gap-2.5" aria-label="Lotes recém-avaliados (mais recentes primeiro)">
          {(feed?.lotes ?? []).map((lote) => {
            const alerta = lote.alerta;
            return (
              <li
                key={lote.id}
                className={cn(
                  "rounded-lg border p-3.5 shadow-[var(--e-1)]",
                  alerta
                    ? "border-[color:var(--c-warning)]/60 bg-[color-mix(in_srgb,var(--c-warning)_10%,var(--surface))]"
                    : "border-border bg-surface",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-data text-xs font-semibold text-muted-foreground">
                      {HORA.format(new Date(lote.recebidoEm))}
                    </span>
                    <span className="font-data text-xs text-muted-foreground">
                      Lote {lote.id.replace("ctc-lote-", "#")}
                    </span>
                  </div>
                  <p className="font-data text-xs text-muted-foreground">
                    <span className="font-semibold text-text-strong">{lote.notas} NFS-e</span> ·{" "}
                    {BRL.format(lote.valorTotal)} · {lote.regrasAvaliadas} regras ·{" "}
                    {lote.processamentoSegundos.toFixed(1)}s
                  </p>
                </div>

                {/* Alerta antecipado: regra que disparou + janela (aceites T07) */}
                {alerta ? (
                  <div className="mt-2.5 grid gap-2 border-t border-[color:var(--c-warning)]/40 pt-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangleIcon
                        aria-hidden="true"
                        className="size-4 text-[color:var(--c-risk-3-txt)]"
                      />
                      <p className="text-xs font-bold uppercase tracking-[0.06em] text-[color:var(--c-risk-3-txt)]">
                        Alerta antecipado · regra: {alerta.regra}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-pill bg-surface px-2 py-0.5 font-data text-[11px] font-semibold text-text-strong">
                        <TimerIcon aria-hidden="true" className="size-3" />
                        fato gerador → detecção: {alerta.janelaMinutos} min
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground">
                      <span className="font-semibold">{alerta.contribuinteNome}</span> —{" "}
                      {alerta.descricao} Score incremental:{" "}
                      <span className="font-data font-semibold">{alerta.scoreIncremental}</span>.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {alerta.sugestaoEnviada && alerta.casoId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/cases?caso=${alerta.casoId}`}>
                            Ver caso {alerta.casoId.toUpperCase()}
                            <ArrowRightIcon aria-hidden="true" className="size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={suggest.isPending}
                          onClick={() => suggest.mutate(alerta.id)}
                        >
                          Sugerir autorregularização
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </AsyncBoundary>

      <footer className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/cases">
            Ver casos abertos nos últimos minutos
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </footer>
    </div>
  );
}

function ContadorCard({
  rotulo,
  valor,
  destaque = false,
  icone: Icon,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  icone?: typeof TimerIcon;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 shadow-[var(--e-1)]",
        destaque
          ? "border-[color:var(--c-warning)]/60 bg-[color-mix(in_srgb,var(--c-warning)_10%,var(--surface))]"
          : "border-border bg-surface",
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
        {rotulo}
      </p>
      <p
        className={cn(
          "mt-1 font-data text-xl font-semibold",
          destaque ? "text-[color:var(--c-risk-3-txt)]" : "text-text-strong",
        )}
      >
        {valor}
      </p>
    </div>
  );
}
