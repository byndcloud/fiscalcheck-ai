"use client";

import { ArrowRightIcon, ClockIcon } from "lucide-react";

import type { Caso, Contribuinte, StatusCaso } from "@fiscalcheck/shared-types";

import { AgentRecommendationBadge } from "@/components/cases/agent-recommendation-badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

/*
  Kanban de casos — visual (sem drag-and-drop). A mudança de status
  passa obrigatoriamente pelos CTAs do dossiê para preservar a cadeia
  decisória imutável (AGENTS.md §1.1 — human-in-the-loop).

  7 colunas fixas na ordem canônica do workflow.
*/

type Props = {
  data: Caso[];
  taxpayerById?: Map<string, Contribuinte>;
  onOpenDossie: (id: string) => void;
};

const COLUMN_ORDER: StatusCaso[] = [
  "candidato",
  "em_analise",
  "aguardando_aprovacao",
  "notificado",
  "em_autorregularizacao",
  "fiscalizacao",
  "encerrado",
];

const COLUMN_LABEL: Record<StatusCaso, string> = {
  candidato: "Candidato",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  notificado: "Notificado",
  em_autorregularizacao: "Em autorregularização",
  fiscalizacao: "Fiscalização",
  encerrado: "Encerrado",
};

const CURRENCY_BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function relativePrazo(prazo?: string): { label: string; tone: "muted" | "warn" | "danger" } {
  if (!prazo) return { label: "Sem prazo", tone: "muted" };
  const target = new Date(prazo).getTime();
  const now = Date.now();
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: "Vence hoje", tone: "danger" };
  if (diffDays > 0) {
    return {
      label: `Vence em ${diffDays}d`,
      tone: diffDays <= 3 ? "warn" : "muted",
    };
  }
  return { label: `Vencido há ${Math.abs(diffDays)}d`, tone: "danger" };
}

export function CaseKanban({ data, taxpayerById, onOpenDossie }: Props) {
  const buckets = new Map<StatusCaso, Caso[]>();
  for (const status of COLUMN_ORDER) buckets.set(status, []);
  for (const caso of data) {
    const bucket = buckets.get(caso.status);
    if (bucket) bucket.push(caso);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {COLUMN_ORDER.map((status) => {
          const items = buckets.get(status) ?? [];
          return (
            <section
              key={status}
              aria-label={`Coluna ${COLUMN_LABEL[status]}`}
              className="flex w-80 shrink-0 flex-col gap-3 rounded-lg border border-border bg-surface p-3 shadow-[var(--e-1)]"
            >
              <header className="flex items-center justify-between gap-2">
                <StatusBadge kind="status" status={status} />
                <span className="rounded-full bg-n-50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <ol className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <li className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum caso.
                  </li>
                ) : (
                  items.map((caso) => (
                    <li key={caso.id}>
                      <CaseCard
                        caso={caso}
                        taxpayer={taxpayerById?.get(caso.contribuinteId)}
                        onOpenDossie={onOpenDossie}
                      />
                    </li>
                  ))
                )}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CaseCard({
  caso,
  taxpayer,
  onOpenDossie,
}: {
  caso: Caso;
  taxpayer?: Contribuinte;
  onOpenDossie: (id: string) => void;
}) {
  const score = caso.scoreValor ?? 0;
  const scoreTone =
    score >= 75
      ? "text-risk-4"
      : score >= 50
        ? "text-risk-3"
        : score >= 25
          ? "text-risk-2"
          : "text-risk-1";
  const prazo = relativePrazo(caso.prazoLimite);
  const prazoClass =
    prazo.tone === "danger"
      ? "text-destructive"
      : prazo.tone === "warn"
        ? "text-risk-3"
        : "text-muted-foreground";

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-sm shadow-[var(--e-1)]",
        "transition-shadow hover:shadow-[var(--e-2)]",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-xs text-text-strong">{caso.id.toUpperCase()}</span>
          <span
            className="truncate text-xs font-medium text-foreground"
            title={taxpayer?.razaoSocial ?? caso.contribuinteId}
          >
            {taxpayer?.nomeFantasia ?? taxpayer?.razaoSocial ?? caso.contribuinteId}
          </span>
          {taxpayer?.atividadePrincipal ? (
            <span className="truncate text-[11px] text-muted-foreground">
              {taxpayer.atividadePrincipal.split("·").at(-1)?.trim() ?? taxpayer.atividadePrincipal}
            </span>
          ) : null}
        </div>
        {caso.agenteResponsavel ? <AgentRecommendationBadge /> : null}
      </header>

      <div className="flex items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span className={cn("font-mono text-2xl font-semibold leading-none", scoreTone)}>
            {score}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            score de risco
          </span>
        </div>
        {caso.valorPotencial ? (
          <div className="flex flex-col items-end text-right">
            <span className="font-mono text-sm font-semibold text-text-strong">
              {CURRENCY_BRL.format(caso.valorPotencial)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              potencial
            </span>
          </div>
        ) : null}
      </div>

      {caso.periodoApuracao ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          {caso.tributo ? `${caso.tributo.toUpperCase()} · ` : ""}
          {caso.periodoApuracao}
        </p>
      ) : null}

      {caso.proximaAcaoRecomendada ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{caso.proximaAcaoRecomendada}</p>
      ) : null}

      <footer className="flex items-center justify-between gap-2 pt-1">
        <span className={cn("inline-flex items-center gap-1 text-[11px]", prazoClass)}>
          <ClockIcon aria-hidden className="size-3" /> {prazo.label}
        </span>
        <Button variant="ghost" size="xs" onClick={() => onOpenDossie(caso.id)}>
          Abrir dossiê
          <ArrowRightIcon aria-hidden />
        </Button>
      </footer>
    </article>
  );
}
