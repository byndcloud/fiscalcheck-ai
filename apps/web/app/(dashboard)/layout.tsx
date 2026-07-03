import Link from "next/link";

import { NotificationBell } from "@/components/notification-bell";

/**
 * Header mínimo do grupo (dashboard) — 62px, borda inferior, conforme
 * docs/design-system/design-system.md §7. Não é o topbar completo da spec
 * (sem busca, sem botão Copilot): cobre só o essencial para hospedar o sino
 * (T01) exigido pelo critério de aceite do T10. Sidebar completa fica para
 * quando houver mais de duas rotas de produto.
 */
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[62px] shrink-0 items-center justify-between border-b bg-surface px-6">
        <nav className="flex items-center gap-6">
          <span className="font-display text-lg font-bold text-brand-deep">FiscalCheck</span>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-text-strong">
              Painel do auditor
            </Link>
            <Link href="/esteira-de-agentes" className="transition-colors hover:text-text-strong">
              Esteira de agentes
            </Link>
          </div>
        </nav>
        <NotificationBell />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
