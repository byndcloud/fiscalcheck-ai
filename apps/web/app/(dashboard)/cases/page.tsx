"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Caso, Contribuinte } from "@fiscalcheck/shared-types";

import { CaseDossieSheet } from "@/components/cases/case-dossie-sheet";
import { CaseKanban } from "@/components/cases/case-kanban";
import { CaseList } from "@/components/cases/case-list";
import { CasesToolbar } from "@/components/cases/cases-toolbar";
import type { CaseView } from "@/components/cases/view-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";

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
  });

  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    staleTime: 5 * 60 * 1000,
  });

  const [view, setView] = useState<CaseView>("kanban");
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "kanban" || stored === "lista") setView(stored);
  }, []);

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

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon aria-hidden className="size-4 animate-spin" /> Carregando casos…
        </div>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível carregar os casos. Tente novamente em instantes.
        </p>
      ) : view === "kanban" ? (
        <CaseKanban data={filteredCasos} taxpayerById={taxpayerById} onOpenDossie={setSelectedId} />
      ) : (
        <CaseList data={filteredCasos} taxpayerById={taxpayerById} onOpenDossie={setSelectedId} />
      )}

      <CaseDossieSheet
        casoId={selectedId}
        casos={casos}
        taxpayerById={taxpayerById}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
