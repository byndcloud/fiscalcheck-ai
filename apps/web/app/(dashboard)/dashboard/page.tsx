"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseIcon, DownloadIcon, GaugeIcon, SparklesIcon, TrendingUpIcon } from "lucide-react";

import type {
  Caso,
  MonthlyRecoverySeries,
  PanelKpis,
  RiskDistribution,
  Score,
  SmartAlert,
} from "@fiscalcheck/shared-types";

import { BigNumberCard } from "@/components/dashboard/big-number-card";
import { MonthlyRecoveryChart } from "@/components/dashboard/monthly-recovery-chart";
import { RiskDistributionPanel } from "@/components/dashboard/risk-distribution-panel";
import { SmartAlertsPanel } from "@/components/dashboard/smart-alerts-panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

/*
  Painel Gerencial. Layout inspirado no protótipo de referência:
  hero com título + ações, três "big numbers" mês a mês, gráfico
  mensal de recuperação, distribuição de risco, alertas inteligentes
  e — ao final — fila priorizada de casos do dia.
*/

export default function DashboardPage() {
  const panelKpis = useQuery({
    queryKey: ["analytics", "panel-kpis"],
    queryFn: () => apiRequest<PanelKpis>("/analytics/panel-kpis"),
  });

  const monthly = useQuery({
    queryKey: ["analytics", "monthly-recovery"],
    queryFn: () => apiRequest<MonthlyRecoverySeries>("/analytics/monthly-recovery"),
  });

  const risk = useQuery({
    queryKey: ["analytics", "risk-distribution"],
    queryFn: () => apiRequest<RiskDistribution>("/analytics/risk-distribution"),
  });

  const alerts = useQuery({
    queryKey: ["analytics", "alerts"],
    queryFn: () => apiRequest<SmartAlert[]>("/analytics/alerts"),
  });

  const casos = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
  });

  const scores = useQuery({
    queryKey: ["ai", "scores"],
    queryFn: () => apiRequest<Score[]>("/ai/scores"),
  });

  const topCasos = (casos.data ?? [])
    .filter((c) => c.status === "aberto" || c.status === "em_analise")
    .sort((a, b) => (b.scoreValor ?? 0) - (a.scoreValor ?? 0))
    .slice(0, 3);

  const scoreLookup = new Map(scores.data?.map((s) => [s.contribuinteId, s]));

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-[#54607a]">
            Painel Gerencial · Exercício 2026 · Piloto Brusque
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-[#121826]">
            Visão geral da arrecadação
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#c5d4f0] text-[13px] font-bold text-[#1351b4] hover:bg-[#eaf1fb]"
          >
            <DownloadIcon aria-hidden="true" className="size-4" />
            Exportar relatório
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#e1e6f0] font-data text-[13px] font-semibold text-[#54607a]"
          >
            Últimos 30 dias
          </Button>
        </div>
      </header>

      <section
        aria-label="Indicadores principais"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {panelKpis.data ? (
          <>
            <BigNumberCard
              kpi={panelKpis.data.recuperado}
              icon={TrendingUpIcon}
              accent="brand"
              positive
            />
            <BigNumberCard
              kpi={panelKpis.data.casosAbertos}
              icon={BriefcaseIcon}
              accent="success"
              positive={false}
            />
            <BigNumberCard
              kpi={panelKpis.data.potencialRecuperavel}
              icon={SparklesIcon}
              accent="aurora"
              positive
            />
          </>
        ) : (
          <SkeletonCards />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {monthly.data ? (
          <MonthlyRecoveryChart data={monthly.data} />
        ) : (
          <SkeletonBlock height="h-72" />
        )}
        {alerts.data ? <SmartAlertsPanel alerts={alerts.data} /> : <SkeletonBlock height="h-72" />}
      </section>

      <section>
        {risk.data ? <RiskDistributionPanel data={risk.data} /> : <SkeletonBlock height="h-40" />}
      </section>

      <section className="rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]">
        <header className="mb-4 flex items-center gap-2">
          <GaugeIcon aria-hidden="true" className="size-4 text-[#1351b4]" />
          <h2 className="font-display text-[15px] font-bold text-[#121826]">
            Casos priorizados por risco
          </h2>
        </header>
        {casos.isLoading || scores.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando casos…</p>
        ) : topCasos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem casos abertos no momento.</p>
        ) : (
          <ol className="grid gap-2">
            {topCasos.map((caso) => {
              const score = scoreLookup.get(caso.contribuinteId);
              return (
                <li
                  key={caso.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-background/60 px-4 py-3"
                >
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{caso.id}</span>
                      <StatusBadge kind="status" status={caso.status} />
                    </div>
                    <p className="text-sm text-foreground">
                      Contribuinte {caso.contribuinteId} · próxima ação:{" "}
                      <span className="text-muted-foreground">
                        {caso.proximaAcaoRecomendada ?? "—"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    {score ? (
                      <StatusBadge kind="risk" level={score.nivel} />
                    ) : (
                      <span className="text-xs text-muted-foreground">sem score</span>
                    )}
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {caso.scoreValor ?? "—"} / 100
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function SkeletonCards() {
  return (
    <>
      <SkeletonBlock height="h-32" />
      <SkeletonBlock height="h-32" />
      <SkeletonBlock height="h-32" />
    </>
  );
}

function SkeletonBlock({ height }: { height: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl border border-[#e1e6f0] bg-[#f4f6fb] ${height}`}
    />
  );
}
