"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, RefreshCwIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import type { AuditChainIntegrity } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/*
  Indicador de integridade da cadeia (módulo 6 · TR 5.4.9).

  Torna a imutabilidade DEMONSTRÁVEL: o hash encadeado é recalculado
  do primeiro ao último evento a cada verificação — qualquer alteração
  em evento passado mudaria o hash e apareceria aqui como violação.
*/

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});
const NUM_FMT = new Intl.NumberFormat("pt-BR");

export function AuditIntegrityCard() {
  const query = useQuery({
    queryKey: ["compliance", "audit-log-v2", "integrity"],
    queryFn: () => apiRequest<AuditChainIntegrity>("/compliance/audit-log-v2/integrity"),
    meta: { silent: true },
  });

  const integrity = query.data;
  const violada = integrity?.status === "violada";

  return (
    <section
      aria-label="Integridade da cadeia de auditoria"
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--r-md)] border p-4",
        violada
          ? "border-[color-mix(in_srgb,var(--c-risk-5)_40%,transparent)] bg-[color-mix(in_srgb,var(--c-risk-5)_8%,var(--surface))]"
          : "border-[color-mix(in_srgb,var(--c-risk-1)_35%,transparent)] bg-[color-mix(in_srgb,var(--c-risk-1)_7%,var(--surface))]",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {query.isPending ? (
          <Loader2Icon aria-hidden="true" className="size-6 shrink-0 animate-spin text-n-400" />
        ) : violada ? (
          <ShieldAlertIcon
            aria-hidden="true"
            className="size-6 shrink-0 text-[color:var(--c-risk-5)]"
          />
        ) : (
          <ShieldCheckIcon
            aria-hidden="true"
            className="size-6 shrink-0 text-[color:var(--c-risk-1)]"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-strong">
            {query.isPending
              ? "Verificando integridade…"
              : violada
                ? "Violação de integridade detectada"
                : "Cadeia íntegra — nenhum evento alterado ou removido"}
          </p>
          {integrity ? (
            <p className="text-[11.5px] text-muted-foreground">
              {NUM_FMT.format(integrity.totalEventos)} eventos encadeados · {integrity.algoritmo} ·
              verificado em {DATE_FMT.format(new Date(integrity.verificadoEm))}
            </p>
          ) : null}
        </div>
      </div>

      {integrity ? (
        <div className="ml-auto flex items-center gap-3">
          <p className="font-data text-[11px] text-muted-foreground">
            hash da cadeia{" "}
            <span className="font-semibold text-text-strong">{integrity.chainHash}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={query.isFetching}
            onClick={async () => {
              const result = await query.refetch();
              if (result.data) {
                toast.success(
                  `Integridade verificada — ${NUM_FMT.format(result.data.totalEventos)} eventos, hash ${result.data.chainHash}.`,
                );
              }
            }}
          >
            <RefreshCwIcon
              aria-hidden="true"
              className={cn("size-3.5", query.isFetching && "animate-spin")}
            />
            Verificar novamente
          </Button>
        </div>
      ) : null}
    </section>
  );
}
