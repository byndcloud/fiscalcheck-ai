"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Caso } from "@fiscalcheck/shared-types";

import { CitizenCaseCard } from "@/components/citizen/citizen-case-card";
import { CitizenCaseSheet } from "@/components/citizen/citizen-case-sheet";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

/*
  Portal do Contribuinte / Autorregularização (T16 · módulo 4 · RF07/FA05).
  Acessível pelo contribuinte ou pelo contador após login mock — nenhum
  dado fiscal é exibido sem identificação (art. 198 CTN, guard no layout).

  Ordem das pendências: quem aguarda ciência primeiro, encerradas por último.
*/

const STATUS_PRIORITY: Record<Caso["status"], number> = {
  notificado: 0,
  em_autorregularizacao: 1,
  fiscalizacao: 2,
  candidato: 3,
  em_analise: 3,
  aguardando_aprovacao: 3,
  encerrado: 4,
};

export default function CitizenPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = useQuery({
    queryKey: ["citizen", "cases"],
    queryFn: () => apiRequest<Caso[]>("/citizen/cases"),
    meta: { silent: true },
  });

  const casos = useMemo(
    () =>
      [...(query.data ?? [])].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]),
    [query.data],
  );

  const selectedCaso = casos.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <PageHeader
        title="Suas pendências fiscais"
        description="Acompanhe e regularize suas pendências com a Secretaria da Fazenda de Brusque — sem filas e no seu tempo. Se preferir, seu contador pode fazer tudo por aqui também."
      />

      <p className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand-050 p-3 text-xs leading-relaxed text-brand-deep">
        <ShieldCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        Suas informações são protegidas por sigilo fiscal (art. 198 do CTN) e pela LGPD. Só você — e
        quem você autorizar — pode vê-las.
      </p>

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={casos.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3">
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
          </div>
        }
        empty={
          <EmptyState
            title="Nenhuma pendência ativa"
            description="Você não possui pendências com a Secretaria da Fazenda de Brusque no momento. Tudo em dia!"
          />
        }
      >
        <ul className="grid gap-3">
          {casos.map((caso) => (
            <li key={caso.id}>
              <CitizenCaseCard
                caso={caso}
                onOpen={(casoId) => {
                  setSelectedId(casoId);
                  setSheetOpen(true);
                }}
              />
            </li>
          ))}
        </ul>
      </AsyncBoundary>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/citizen/termos"
            className="inline-flex items-center gap-1 hover:text-brand hover:underline focus-visible:outline-none focus-visible:underline"
          >
            <FileTextIcon aria-hidden className="size-3" />
            Termos de uso
          </Link>
          <Link
            href="/citizen/privacidade"
            className="inline-flex items-center gap-1 hover:text-brand hover:underline focus-visible:outline-none focus-visible:underline"
          >
            <ShieldCheckIcon aria-hidden className="size-3" />
            Privacidade, LGPD e DPO
          </Link>
        </div>
        <p>Secretaria da Fazenda de Brusque/SC</p>
      </footer>

      <CitizenCaseSheet caso={selectedCaso} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
