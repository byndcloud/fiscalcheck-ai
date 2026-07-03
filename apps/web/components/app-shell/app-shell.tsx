"use client";

import { useState } from "react";
import type * as React from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

/*
  Shell autenticado. Orquestra o layout de sidebar + header + main.
  Mobile (<md): sidebar em Sheet controlado por state local.
  Desktop (>=md): sidebar sempre visível numa coluna fixa de 256px.
*/

type AppShellProps = {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
};

export function AppShell({ children, breadcrumb }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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

      <div className="flex min-h-svh flex-col">
        <Header breadcrumb={breadcrumb} onMenuClick={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
