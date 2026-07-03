"use client";

import { HistoryIcon, UserIcon } from "lucide-react";

import type { RiskModelChange } from "@fiscalcheck/shared-types";

import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { cn } from "@/lib/utils";

/*
  Histórico de alterações do modelo (T02 · módulo 3).
  Cadeia append-only — atende ao critério "histórico de alterações de
  parâmetros (quem/quando) registrado". Timeline com Actor + relative
  time; timestamp absoluto acessível via <time title>.
*/

type RiskModelHistoryProps = {
  history: readonly RiskModelChange[];
};

const FIELD_LABEL: Record<string, string> = {
  "weights.cruzamento": "Peso · Cruzamento",
  "weights.grafo": "Peso · Grafo",
  "weights.cadastro": "Peso · Cadastro",
  "weights.historico": "Peso · Histórico",
  "bands.baixo": "Faixa · Conforme→Baixo",
  "bands.medio": "Faixa · Baixo→Médio",
  "bands.alto": "Faixa · Médio→Alto",
  "bands.critico": "Faixa · Alto→Crítico",
};

function fieldLabelFor(field: string): string {
  if (FIELD_LABEL[field]) return FIELD_LABEL[field];
  if (field.startsWith("rules.")) return "Regra";
  return field;
}

const FORMATTER_ABSOLUTE = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function RiskModelHistory({ history }: RiskModelHistoryProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="Nenhuma alteração registrada ainda"
        description="Publicações do modelo de risco aparecerão aqui em ordem cronológica, com quem publicou e o resumo da mudança."
      />
    );
  }

  return (
    <section
      aria-label="Histórico de alterações do modelo de risco"
      className="grid gap-4 rounded-[var(--r-lg)] border border-border bg-surface p-6 shadow-[var(--e-1)]"
    >
      <header className="grid gap-1">
        <h2 className="text-[15px] font-bold text-text-strong">Histórico de publicações</h2>
        <p className="text-xs text-muted-foreground">
          Registro append-only: cada alteração publicada é imutável, com autor, timestamp e campos
          afetados — vinculado ao log de auditoria (T19).
        </p>
      </header>
      <ol className="grid gap-3">
        {history.map((entry, index) => {
          const absolute = FORMATTER_ABSOLUTE.format(new Date(entry.timestamp));
          const relative = formatRelativeTime(entry.timestamp);
          return (
            <li
              key={entry.id}
              className={cn(
                "grid gap-3 rounded-[var(--r-md)] border border-border/60 p-4",
                index === 0 ? "bg-brand-050/40" : "bg-n-25/40",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-data text-[13px] font-bold text-text-strong">
                    {entry.toVersion}
                  </span>
                  <span aria-hidden="true" className="text-text-muted">
                    ←
                  </span>
                  <span className="font-data text-[11px] text-text-muted">{entry.fromVersion}</span>
                  {index === 0 ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      vigente
                    </span>
                  ) : null}
                </div>
                <time
                  className="font-data text-[11px] text-text-muted"
                  dateTime={entry.timestamp}
                  title={absolute}
                >
                  {relative} · {absolute}
                </time>
              </div>

              <p className="text-[13px] leading-relaxed text-text-default">{entry.summary}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-[12px] text-text-muted">
                  <span
                    aria-hidden="true"
                    className="grid size-6 place-items-center rounded-full bg-brand-050 text-brand"
                  >
                    <UserIcon className="size-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold text-text-strong">{entry.actorName}</span>{" "}
                    <span className="text-text-muted">· {ROLE_LABEL_PT[entry.actorRole]}</span>
                  </span>
                </div>
                {entry.fieldsChanged.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {entry.fieldsChanged.map((field) => (
                      <li
                        key={field}
                        className="rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted"
                      >
                        {fieldLabelFor(field)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
