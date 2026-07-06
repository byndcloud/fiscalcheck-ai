"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Caso, Contribuinte } from "@fiscalcheck/shared-types";

import { CaseKanban } from "@/components/cases/case-kanban";
import { CaseList } from "@/components/cases/case-list";
import { CasesToolbar } from "@/components/cases/cases-toolbar";
import type { CaseView } from "@/components/cases/view-toggle";
import { AsyncBoundary } from "@/components/ui/async-boundary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import { useDossieStore } from "@/stores/dossie-store";

const VIEW_STORAGE_KEY = "fiscalcheck.cases.view";

const STATUS_LABEL_PT: Record<Caso["status"], string> = {
  candidato: "Candidato",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  notificado: "Notificado",
  em_autorregularizacao: "Em autorregularização",
  fiscalizacao: "Fiscalização",
  encerrado: "Encerrado",
};

const RECOMENDACAO_LABEL_PT: Record<string, string> = {
  intimacao: "Intimação",
  autorregularizacao: "Autorregularização",
  fiscalizacao: "Fiscalização",
};

/*
  Página /cases (T13 — módulo 4). Toolbar compartilhada (busca + toggle)
  sempre visível; Kanban e Lista consomem o mesmo dataset filtrado.
  O dossiê é aberto sob demanda. Cidadão não chega aqui (guardado pelo
  AppShell + sidebar).
*/
export default function CasesPage() {
  const query = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
    // T25: erro tratado inline pelo AsyncBoundary — sem toast duplicado.
    meta: { silent: true },
  });

  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });

  const [view, setView] = useState<CaseView>("kanban");
  const [filter, setFilter] = useState("");
  const openDossie = useDossieStore((s) => s.openDossie);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "kanban" || stored === "lista") setView(stored);
  }, []);

  /*
    Deep-link T05 → T13: /cases?caso=cs-… abre o dossiê direto.
    Lido de window.location para evitar o boundary de Suspense exigido
    por useSearchParams em página client.
  */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const casoParam = new URLSearchParams(window.location.search).get("caso");
    if (casoParam) openDossie(casoParam);
  }, [openDossie]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const casos = useMemo(() => query.data ?? [], [query.data]);
  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const c of taxpayers.data ?? []) map.set(c.id, c);
    return map;
  }, [taxpayers.data]);

  const filteredCasos = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return casos;
    return casos.filter((caso) => {
      const taxpayer = taxpayerById.get(caso.contribuinteId);
      const haystack = [
        caso.id,
        caso.contribuinteId,
        STATUS_LABEL_PT[caso.status],
        caso.status,
        caso.proximaAcaoRecomendada ?? "",
        caso.recomendacao?.acao ? (RECOMENDACAO_LABEL_PT[caso.recomendacao.acao] ?? "") : "",
        caso.tributo ?? "",
        taxpayer?.razaoSocial ?? "",
        taxpayer?.nomeFantasia ?? "",
        taxpayer?.atividadePrincipal ?? "",
        taxpayer?.inscricaoMunicipal ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [casos, filter, taxpayerById]);

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Gestão de casos"
        description="Fila, dossiê e workflow de aprovação. Toda decisão passa pelo auditor autenticado. Módulo 4."
      />

      <CasesToolbar
        view={view}
        onViewChange={setView}
        filter={filter}
        onFilterChange={setFilter}
        total={casos.length}
        visible={filteredCasos.length}
      />

      <AsyncBoundary
        isLoading={query.isPending}
        isError={query.isError}
        isEmpty={casos.length === 0}
        error={query.error}
        onRetry={() => query.refetch()}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
            <SkeletonCard height="h-40" />
          </div>
        }
        empty={
          <EmptyState
            icon={BriefcaseIcon}
            title="Nenhum caso na fila"
            description="Assim que o motor de risco identificar novos candidatos ou o auditor abrir um caso manualmente, eles aparecerão aqui."
          />
        }
      >
        {filteredCasos.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="Nenhum caso corresponde à busca"
            description="Ajuste o texto do filtro ou limpe para ver todos os casos ativos."
          />
        ) : view === "kanban" ? (
          <CaseKanban data={filteredCasos} taxpayerById={taxpayerById} onOpenDossie={openDossie} />
        ) : (
          <CaseList data={filteredCasos} taxpayerById={taxpayerById} onOpenDossie={openDossie} />
        )}
      </AsyncBoundary>
    </div>
  );
}
