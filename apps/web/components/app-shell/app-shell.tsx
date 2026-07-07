"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type * as React from "react";

import type { Caso, Contribuinte } from "@fiscalcheck/shared-types";

import { CaseDossieSheet } from "@/components/cases/case-dossie-sheet";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/api-client";
import { useDossieStore } from "@/stores/dossie-store";

import { CopilotFab } from "./copilot-fab";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

/*
  Shell autenticado. Orquestra o layout de sidebar + header + main.
  Mobile (<md): sidebar em Sheet controlado por state local.
  Desktop (>=md): sidebar sempre visível numa coluna fixa de 256px.

  Monta também, uma única vez, o Dossiê de caso e o Copilot Fiscal
  (T18/T24) — ambos precisam abrir de qualquer tela, não só de /cases.
  As queries ["cases"]/["taxpayers"] usam a mesma queryKey de /cases,
  então o React Query reaproveita o cache em vez de duplicar o fetch.
*/

type AppShellProps = {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
};

export function AppShell({ children, breadcrumb }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openCasoId = useDossieStore((s) => s.openCasoId);
  const closeDossie = useDossieStore((s) => s.closeDossie);

  const casos = useQuery({
    queryKey: ["cases"],
    queryFn: () => apiRequest<Caso[]>("/cases"),
    enabled: openCasoId !== null,
  });
  const taxpayers = useQuery({
    queryKey: ["taxpayers"],
    queryFn: () => apiRequest<Contribuinte[]>("/taxpayers"),
    enabled: openCasoId !== null,
    staleTime: 5 * 60 * 1000,
  });

  const taxpayerById = useMemo(() => {
    const map = new Map<string, Contribuinte>();
    for (const c of taxpayers.data ?? []) map.set(c.id, c);
    return map;
  }, [taxpayers.data]);

  return (
    <div
      data-slot="app-shell"
      className="grid min-h-svh grid-cols-1 bg-background md:grid-cols-[16rem_1fr]"
    >
      <aside className="hidden md:block">
        <Sidebar className="h-full" />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar className="h-full border-r-0" onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* min-w-0 impede que conteúdo largo (tabelas) expanda a coluna 1fr do grid. */}
      <div className="flex min-h-svh min-w-0 flex-col">
        <Header breadcrumb={breadcrumb} onMenuClick={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <CaseDossieSheet
        casoId={openCasoId}
        casos={casos.data ?? []}
        taxpayerById={taxpayerById}
        open={openCasoId !== null}
        onOpenChange={(open) => {
          if (!open) closeDossie();
        }}
      />
      <CopilotPanel />
      <CopilotFab />
    </div>
  );
}
