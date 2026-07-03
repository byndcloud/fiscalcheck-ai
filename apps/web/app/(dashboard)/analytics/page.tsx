"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  TargetIcon,
  TrendingUpIcon,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";
import type { KPIsAnalytics } from "@/mocks/fixtures/kpis";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const PCT = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const CARDS: {
  key: keyof Pick<
    KPIsAnalytics,
    | "casosAbertos"
    | "casosEmAnalise"
    | "valorRecuperavelBrl"
    | "divergenciasCriticas"
    | "metasEmRisco"
    | "scoreMedio"
    | "taxaAutorregularizacao"
  >;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  format: (v: number) => string;
}[] = [
  {
    key: "casosAbertos",
    label: "Casos abertos",
    icon: BriefcaseIcon,
    format: (v) => v.toString(),
  },
  {
    key: "casosEmAnalise",
    label: "Casos em análise",
    icon: ActivityIcon,
    format: (v) => v.toString(),
  },
  {
    key: "valorRecuperavelBrl",
    label: "Valor recuperável",
    icon: TrendingUpIcon,
    format: (v) => BRL.format(v),
  },
  {
    key: "divergenciasCriticas",
    label: "Divergências críticas",
    icon: AlertTriangleIcon,
    format: (v) => v.toString(),
  },
  {
    key: "scoreMedio",
    label: "Score médio",
    icon: TargetIcon,
    format: (v) => v.toFixed(1),
  },
  {
    key: "taxaAutorregularizacao",
    label: "Autorregularização",
    icon: TargetIcon,
    format: (v) => PCT.format(v),
  },
];

export default function AnalyticsPage() {
  const query = useQuery({
    queryKey: ["analytics", "kpis"],
    queryFn: () => apiRequest<KPIsAnalytics>("/analytics/kpis"),
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Monitoramento gerencial"
        description="Indicadores do trimestre — casos, valor recuperável e metas. Módulo 5."
      />

      {query.data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CARDS.map((card) => (
              <article
                key={card.key}
                className="grid gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--e-1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <span className="grid size-8 place-items-center rounded-md bg-brand-050 text-brand">
                    <card.icon aria-hidden className="size-4" />
                  </span>
                </div>
                <p className="font-display text-2xl font-semibold text-text-strong">
                  {card.format(query.data[card.key])}
                </p>
              </article>
            ))}
          </section>

          <p className="text-xs text-muted-foreground">
            Última atualização: {DATE.format(new Date(query.data.atualizadoEm))}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      )}
    </div>
  );
}
