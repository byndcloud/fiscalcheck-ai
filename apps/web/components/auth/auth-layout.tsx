import type * as React from "react";

import { InstitutionalPanel } from "./institutional-panel";

/*
  Layout split-screen 55/45 do fluxo de acesso.
  <768px: mostra apenas o formulário — a marca aparece dentro do LoginForm.
*/
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="auth-layout"
      className="grid min-h-svh grid-cols-1 bg-background md:grid-cols-[55%_45%]"
    >
      <div className="hidden md:block">
        <InstitutionalPanel />
      </div>

      <main className="flex items-center justify-center px-6 py-10 md:px-10 md:py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
