"use client";

import { AlertTriangleIcon, ChevronRightIcon } from "lucide-react";

import type { AuditLogEntry, AuditLogResult } from "@fiscalcheck/shared-types";

import { EmptyState } from "@/components/ui/empty-state";
import { maskIp, maskSensitiveText } from "@/lib/masks";
import { cn } from "@/lib/utils";

/*
  Tabela da trilha (T19 · módulo 6).

  DataTable custom (não usa o genérico) porque exige:
  - fonte de dados (Montserrat, via font-data) predominante nas colunas;
  - linha inteira em vermelho quando `atypical=true`;
  - máscara de IP e de CPF/CNPJ por padrão no resource/details.
*/

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

const RESULT_STYLE: Record<AuditLogResult, string> = {
  sucesso:
    "bg-[color-mix(in_srgb,var(--c-risk-1)_14%,var(--surface))] text-[color:var(--c-risk-1)] border-[color-mix(in_srgb,var(--c-risk-1)_35%,transparent)]",
  negado:
    "bg-[color-mix(in_srgb,var(--c-danger)_16%,var(--surface))] text-[color:var(--c-danger)] border-[color-mix(in_srgb,var(--c-danger)_35%,transparent)]",
  erro: "bg-[color-mix(in_srgb,var(--c-warning)_16%,var(--surface))] text-[color:var(--c-warning)] border-[color-mix(in_srgb,var(--c-warning)_35%,transparent)]",
};

const RESULT_LABEL: Record<AuditLogResult, string> = {
  sucesso: "Sucesso",
  negado: "Negado",
  erro: "Erro",
};

type Props = {
  entries: readonly AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
};

export function AuditLogTable({ entries, onSelect }: Props) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Nenhum evento encontrado"
        description="Ajuste os filtros ou o período selecionado. A trilha continua acumulando eventos em background."
      />
    );
  }

  return (
    <section
      aria-label="Trilha de auditoria"
      className="overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface shadow-[var(--e-1)]"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-border bg-n-50/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">
                Quando
              </th>
              <th scope="col" className="px-3 py-2.5">
                Ator
              </th>
              <th scope="col" className="px-3 py-2.5">
                Ação
              </th>
              {/* Colunas técnicas saem em telas estreitas — o detalhe do evento
                  continua mostrando tudo. Evita scroll horizontal na trilha. */}
              <th scope="col" className="hidden px-3 py-2.5 md:table-cell">
                Recurso
              </th>
              <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">
                IP
              </th>
              <th scope="col" className="px-3 py-2.5">
                Resultado
              </th>
              <th scope="col" className="w-8 px-3 py-2.5">
                <span className="sr-only">Detalhes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditLogRow({
  entry,
  onSelect,
}: {
  entry: AuditLogEntry;
  onSelect: (entry: AuditLogEntry) => void;
}) {
  const atypical = entry.atypical;
  return (
    <tr
      data-atypical={atypical ? "true" : "false"}
      className={cn(
        "border-b border-border/60 transition-colors last:border-b-0",
        atypical
          ? "bg-[color-mix(in_srgb,var(--c-danger)_6%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--c-danger)_10%,var(--surface))]"
          : "hover:bg-n-50/60",
      )}
    >
      <td className="px-3 py-2.5 align-top">
        <span className="font-data text-[12px] text-text-strong">
          {DATE_FMT.format(new Date(entry.timestamp))}
        </span>
        <p className="font-data text-[10px] text-muted-foreground">{entry.id}</p>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span className="text-[13px] font-medium text-text-strong">{entry.actorName}</span>
        <p className="text-[11px] text-muted-foreground">{entry.actorRole}</p>
      </td>
      <td className="px-3 py-2.5 align-top">
        <code
          className={cn(
            "font-data text-[12px]",
            atypical ? "font-semibold text-[color:var(--c-danger)]" : "text-text-strong",
          )}
        >
          {entry.action}
        </code>
        {atypical && entry.atypicalReason ? (
          <p className="mt-1 flex items-start gap-1 text-[11px] text-[color:var(--c-danger)]">
            <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
            <span>{entry.atypicalReason}</span>
          </p>
        ) : null}
      </td>
      <td className="hidden px-3 py-2.5 align-top md:table-cell">
        <code className="break-all font-data text-[12px] text-text-muted">
          {maskSensitiveText(entry.resource)}
        </code>
      </td>
      <td className="hidden px-3 py-2.5 align-top lg:table-cell">
        <code className="font-data text-[12px] text-text-muted">{maskIp(entry.ipAddress)}</code>
      </td>
      <td className="px-3 py-2.5 align-top">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            RESULT_STYLE[entry.result],
          )}
        >
          {RESULT_LABEL[entry.result]}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle text-right">
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
            "hover:bg-brand-050 hover:text-brand",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
          )}
          aria-label={`Abrir detalhes do evento ${entry.id}`}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </button>
      </td>
    </tr>
  );
}
