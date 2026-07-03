"use client";

import type {
  IngestionLoad,
  IngestionLoadStatus,
  ValidationLogLevel,
} from "@fiscalcheck/shared-types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { LgpdBadge } from "./lgpd-badge";

/*
  Drawer lateral acionado pelo LoadsMonitor. Mostra log de validação
  cronológico (do mais recente para o mais antigo) e amostra de
  registros rejeitados. IDs em Roboto Mono para leitura auditável.
*/

const STATUS_META: Record<IngestionLoadStatus, { label: string; className: string }> = {
  recebido: { label: "Recebido", className: "bg-brand-050 text-brand" },
  validando: {
    label: "Validando",
    className: "bg-[color:var(--c-risk-3)]/15 text-[color:var(--c-risk-3)]",
  },
  processado: {
    label: "Processado",
    className: "bg-[color:var(--c-risk-2)]/15 text-[color:var(--c-risk-1)]",
  },
  com_erro: {
    label: "Com erro",
    className: "bg-[color:var(--c-risk-5)]/15 text-[color:var(--c-risk-5)]",
  },
  quarentena: {
    label: "Quarentena",
    className: "bg-[color:var(--c-risk-4)]/15 text-[color:var(--c-risk-4)]",
  },
};

const LEVEL_META: Record<ValidationLogLevel, { label: string; dot: string; text: string }> = {
  info: { label: "Info", dot: "bg-brand-300", text: "text-brand-deep" },
  warn: { label: "Aviso", dot: "bg-[color:var(--c-risk-3)]", text: "text-[color:var(--c-risk-3)]" },
  erro: { label: "Erro", dot: "bg-[color:var(--c-risk-5)]", text: "text-[color:var(--c-risk-5)]" },
};

const TIME_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type SheetLoadDetailsProps = {
  load: IngestionLoad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SheetLoadDetails({ load, open, onOpenChange }: SheetLoadDetailsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:!max-w-lg">
        {load ? (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_META[load.status].className,
                  )}
                >
                  {STATUS_META[load.status].label}
                </span>
                {load.pseudonimizado ? <LgpdBadge compact /> : null}
              </div>
              <SheetTitle className="font-mono text-base tracking-tight">{load.id}</SheetTitle>
              <SheetDescription>
                {load.fonteNome} · {new Intl.NumberFormat("pt-BR").format(load.registros)} registros
                · {load.rejeitadosPercent.toFixed(2)}% rejeitados
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-5 overflow-y-auto">
              <section>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Log de validação
                </h4>
                <ol className="grid gap-2">
                  {load.validationLog.map((entry, idx) => {
                    const level = LEVEL_META[entry.nivel];
                    return (
                      <li
                        key={`${load.id}-log-${idx}`}
                        className="grid grid-cols-[auto_1fr] gap-3 rounded-md border border-border bg-n-25/40 p-3"
                      >
                        <span
                          aria-hidden="true"
                          className={cn("mt-1 size-2 rounded-full", level.dot)}
                        />
                        <div className="grid gap-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "text-[11px] font-semibold uppercase tracking-wide",
                                level.text,
                              )}
                            >
                              {level.label}
                            </span>
                            <time
                              dateTime={entry.timestamp}
                              className="whitespace-nowrap font-mono text-[11px] text-muted-foreground"
                            >
                              {TIME_FMT.format(new Date(entry.timestamp))}
                            </time>
                          </div>
                          <p className="text-xs text-text-strong leading-snug">{entry.mensagem}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <section>
                <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Registros rejeitados
                </h4>
                {load.rejectedSamples.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-n-25/30 px-3 py-4 text-xs text-muted-foreground">
                    Nenhum registro rejeitado nesta carga.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-n-25 text-[10px] uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Linha</th>
                          <th className="px-3 py-2 text-left font-semibold">Motivo</th>
                          <th className="px-3 py-2 text-left font-semibold">Campo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {load.rejectedSamples.map((sample, idx) => (
                          <tr key={`${load.id}-rej-${idx}`} className="border-t border-border">
                            <td className="px-3 py-2 font-mono text-text-strong">{sample.linha}</td>
                            <td className="px-3 py-2 text-text-strong">{sample.motivo}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              {sample.campo ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
