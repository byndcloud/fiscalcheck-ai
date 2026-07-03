"use client";

import { useQuery } from "@tanstack/react-query";

import type { Caso } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/api-client";

/*
  Portal do cidadão. Reaproveita o AppShell — sidebar já mostra apenas
  o item "Cidadão" para role `cidadao`. Foco em autorregularização.
*/
export default function CitizenPage() {
  const query = useQuery({
    queryKey: ["citizen", "cases"],
    queryFn: () => apiRequest<Caso[]>("/citizen/cases"),
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Meus atendimentos"
        description="Acompanhe as pendências fiscais em seu nome e regularize com um clique. Parte do módulo 4."
        action={
          <Button variant="secondary" size="sm" disabled>
            Solicitar atendimento presencial
          </Button>
        }
      />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando seus atendimentos…</p>
      ) : (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nenhuma pendência ativa"
          description="Você não possui casos abertos com a Secretaria da Fazenda de Brusque no momento."
        />
      ) : (
        <ul className="grid gap-3">
          {query.data?.map((caso) => (
            <li
              key={caso.id}
              className="rounded-lg border border-border bg-surface p-5 shadow-[var(--e-1)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{caso.id}</span>
                    <StatusBadge kind="status" status={caso.status} />
                  </div>
                  <p className="text-sm text-foreground">
                    {caso.proximaAcaoRecomendada ?? "Aguardando análise da equipe da SEFAZ."}
                  </p>
                  {caso.observacoes ? (
                    <p className="text-xs text-muted-foreground">{caso.observacoes}</p>
                  ) : null}
                </div>
                <Button variant="secondary" size="sm">
                  Enviar documentação
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
