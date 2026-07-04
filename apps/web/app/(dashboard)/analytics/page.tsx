"use client";

import { useQuery } from "@tanstack/react-query";
import { FileDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MetaPiloto,
  MonthlyRecoverySeries,
  PanelManagerKpis,
  PanelManagerPeriodo,
  SusAvaliacao,
} from "@fiscalcheck/shared-types";

import { KpiTrendCard } from "@/components/analytics/kpi-trend-card";
import { MetaProgressCard } from "@/components/analytics/meta-progress-card";
import { PeriodFilter } from "@/components/analytics/period-filter";
import { ReportGeneratorModal } from "@/components/analytics/report-generator-modal";
import { SusSurveyModal } from "@/components/analytics/sus-survey-modal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { computeSusMedia } from "@/lib/analytics/sus";
import { apiRequest } from "@/lib/api-client";
import { formatCurrencyBRL } from "@/lib/format-currency";

/*
  Painel do Gestor (T17 · módulo 5). Rota já restrita a supervisor+admin
  no layout do (dashboard). Reúne:

    · 7 KPIs com sparkline e drill-down para /cases
    · 3 metas do piloto (70/100/80) com captura de SUS na usabilidade
    · AreaChart de recuperação mensal + PieChart de distribuição por status
    · Botão único de gerador de relatórios (PDF/XLSX, ADR-0005/0006)
*/

const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

const PIE_COLORS = ["#1351B4", "#3b82f6", "#f2a900", "#e8590c", "#c5160b", "#168821"] as const;

async function fetchKpis(periodo: PanelManagerPeriodo): Promise<PanelManagerKpis> {
  return await apiRequest<PanelManagerKpis>(`/analytics/panel-manager-kpis?periodo=${periodo}`);
}

async function fetchMetas(): Promise<MetaPiloto[]> {
  return await apiRequest<MetaPiloto[]>("/analytics/metas");
}

async function fetchSus(): Promise<SusAvaliacao[]> {
  return await apiRequest<SusAvaliacao[]>("/analytics/sus");
}

async function fetchMonthlyRecovery(): Promise<MonthlyRecoverySeries> {
  return await apiRequest<MonthlyRecoverySeries>("/analytics/monthly-recovery");
}

export default function AnalyticsPage() {
  const [periodo, setPeriodo] = useState<PanelManagerPeriodo>("30d");
  const [susOpen, setSusOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const kpisQuery = useQuery({
    queryKey: ["analytics", "panel-manager-kpis", periodo],
    queryFn: () => fetchKpis(periodo),
    staleTime: 60_000,
  });
  const metasQuery = useQuery({
    queryKey: ["analytics", "metas"],
    queryFn: fetchMetas,
    staleTime: 60_000,
  });
  const susQuery = useQuery({
    queryKey: ["analytics", "sus"],
    queryFn: fetchSus,
    staleTime: 60_000,
  });
  const recoveryQuery = useQuery({
    queryKey: ["analytics", "monthly-recovery"],
    queryFn: fetchMonthlyRecovery,
    staleTime: 60_000,
  });

  const kpis = kpisQuery.data?.kpis ?? [];
  const metas = metasQuery.data ?? [];
  const susAvaliacoes = susQuery.data ?? [];
  const recovery = recoveryQuery.data;
  const susMedia = useMemo(
    () => computeSusMedia(susAvaliacoes.map((s) => s.score)),
    [susAvaliacoes],
  );

  const statusPie = useMemo(() => {
    const casosKpi = kpis.find((k) => k.key === "casosAbertos");
    const analiseKpi = kpis.find((k) => k.key === "casosEmAnalise");
    const divergencias = kpis.find((k) => k.key === "divergenciasCriticas");
    return [
      { name: "Abertos", value: casosKpi?.valor ?? 0 },
      { name: "Em análise", value: analiseKpi?.valor ?? 0 },
      { name: "Divergências críticas", value: divergencias?.valor ?? 0 },
    ].filter((s) => s.value > 0);
  }, [kpis]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Painel do Gestor"
        description="Metas do piloto, KPIs em tempo real e relatórios da fiscalização — módulo 5."
        action={
          <>
            <PeriodFilter value={periodo} onChange={setPeriodo} />
            <Button
              type="button"
              size="sm"
              onClick={() => setReportOpen(true)}
              disabled={!kpisQuery.data || !metasQuery.data}
            >
              <FileDownIcon aria-hidden="true" className="mr-2 size-4" />
              Gerar relatório
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <section aria-labelledby="secao-kpis" className="grid gap-4">
        <h2 id="secao-kpis" className="sr-only">
          Indicadores em tempo real
        </h2>
        {kpisQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiTrendCard key={kpi.key} kpi={kpi} />
            ))}
          </div>
        )}
      </section>

      {/* Metas */}
      <section aria-labelledby="secao-metas" id="metas" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="grid gap-1">
            <h2 id="secao-metas" className="font-display text-lg font-semibold text-[#121826]">
              Metas do piloto
            </h2>
            <p className="text-sm text-muted-foreground">
              Baseline × atual × alvo — acurácia, ganho de escala e usabilidade.
            </p>
          </div>
          {susAvaliacoes.length > 0 ? (
            <p className="text-[12px] text-[#66718a]">
              Média SUS: <strong className="text-[#121826]">{susMedia.toFixed(1)}</strong> ·{" "}
              {susAvaliacoes.length} {susAvaliacoes.length === 1 ? "avaliação" : "avaliações"}
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {metas.map((meta) => (
            <MetaProgressCard key={meta.id} meta={meta}>
              {meta.codigo === "usabilidade" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSusOpen(true)}
                >
                  Responder SUS
                </Button>
              ) : null}
            </MetaProgressCard>
          ))}
        </div>
      </section>

      {/* Gráficos */}
      <section aria-labelledby="secao-graficos" className="grid gap-4 lg:grid-cols-2">
        <h2 id="secao-graficos" className="sr-only">
          Séries e distribuições
        </h2>

        <article className="grid gap-3 rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]">
          <header className="grid gap-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#54607a]">
              Recuperação mensal
            </p>
            <p className="text-[12px] text-[#66718a]">
              Recuperado vs. potencial estimado — últimos 12 meses.
            </p>
          </header>
          {recovery ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={recovery.pontos}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="fill-recuperado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1351b4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1351b4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fill-potencial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#19d3e8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#19d3e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#66718a" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#66718a"
                    tickFormatter={(v: number) => `R$ ${(v / 1_000_000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e1e6f0", fontSize: 12 }}
                    formatter={(v) => (typeof v === "number" ? formatCurrencyBRL(v) : String(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="recuperadoBrl"
                    name="Recuperado"
                    stroke="#1351b4"
                    fill="url(#fill-recuperado)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="potencialBrl"
                    name="Potencial"
                    stroke="#19d3e8"
                    fill="url(#fill-potencial)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Carregando série…</p>
          )}
        </article>

        <article className="grid gap-3 rounded-2xl border border-[#e1e6f0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.06),0_1px_3px_rgba(16,24,40,0.07)]">
          <header className="grid gap-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#54607a]">
              Distribuição por status
            </p>
            <p className="text-[12px] text-[#66718a]">
              Casos abertos, em análise e divergências críticas em aberto.
            </p>
          </header>
          {statusPie.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    outerRadius="70%"
                    innerRadius="45%"
                    label={(entry: { name?: string; value?: number }) =>
                      `${entry.name ?? ""} · ${entry.value ?? 0}`
                    }
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {statusPie.map((_, index) => (
                      <Cell
                        // biome-ignore lint/suspicious/noArrayIndexKey: cores estáveis por índice
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: "#e1e6f0", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados no período.</p>
          )}
        </article>
      </section>

      {kpisQuery.data ? (
        <p className="text-xs text-muted-foreground">
          Última atualização: {DATE.format(new Date(kpisQuery.data.atualizadoEm))}
        </p>
      ) : null}

      {/* Modais */}
      <SusSurveyModal metaId="meta-usabilidade" open={susOpen} onOpenChange={setSusOpen} />
      <ReportGeneratorModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        kpis={kpis}
        metas={metas}
        susAvaliacoes={susAvaliacoes}
      />
    </div>
  );
}
