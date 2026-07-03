import { ArrowRightIcon, FileClockIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/*
  Navegação rápida da visão geral (T19 · módulo 6).

  Só renderizado para Admin — Supervisor não tem acesso às sub-rotas
  `/compliance/trilha` e `/compliance/usuarios` (RBAC estrito ao card).
  Deixa visível o caminho para as ações administrativas sem poluir a
  sidebar principal.
*/

const CARDS = [
  {
    href: "/compliance/trilha" as const,
    icon: FileClockIcon,
    title: "Trilha completa",
    description: "Todos os eventos, filtros e export CSV/JSON para o órgão de controle.",
  },
  {
    href: "/compliance/usuarios" as const,
    icon: UsersRoundIcon,
    title: "Usuários & papéis",
    description: "CRUD de servidores autorizados com step-up MFA e menor privilégio.",
  },
];

export function OverviewQuickNav() {
  return (
    <nav aria-label="Ações administrativas" className="grid gap-3 sm:grid-cols-2">
      {CARDS.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className={cn(
            "group flex items-start gap-3 rounded-[var(--r-lg)] border border-border bg-surface p-4 shadow-[var(--e-1)] transition-all",
            "hover:border-brand/40 hover:shadow-[var(--e-2)]",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-050 text-brand transition-colors group-hover:bg-brand group-hover:text-white"
          >
            <card.icon className="size-5" />
          </span>
          <div className="grid gap-0.5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-strong">
              {card.title}
              <ArrowRightIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </h3>
            <p className="text-xs leading-snug text-text-muted">{card.description}</p>
          </div>
        </Link>
      ))}
    </nav>
  );
}
