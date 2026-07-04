"use client";

import {
  BarChart3Icon,
  BriefcaseIcon,
  DatabaseIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  ScanSearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Role } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Sidebar navy. Identidade visual inspirada no protótipo de referência:
  fundo em gradiente #071D41 → #0A2552 (--c-brand-darkest → deep navy),
  texto branco/muted-navy, seções agrupadas em OPERAÇÃO / GOVERNANÇA,
  estado ativo destacado por barra aurora vertical + tinta translúcida.

  A ordem e o filtro por papel permanecem inalterados (7 módulos + dashboard),
  e o item de IA continua com aurora explícita — traço reservado ao
  módulo agêntico pelo DS §3.2.
*/

type NavItem = {
  href: Route;
  label: string;
  description: string;
  icon: LucideIcon;
  roles: readonly Role[];
  aurora?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: readonly NavItem[];
};

const AUDITORIAL_ROLES: readonly Role[] = ["auditor", "supervisor", "admin"] as const;

const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: "operacao",
    label: "Operação",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Visão geral do dia",
        icon: LayoutDashboardIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/ingestion",
        label: "Ingestão",
        description: "NFS-e, DIMP, PGDAS, cadastro",
        icon: DatabaseIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/crossing",
        label: "Detecção",
        description: "Cruzamento de divergências",
        icon: ScanSearchIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/ai",
        label: "Risco & IA",
        description: "Scores e agentes",
        icon: SparklesIcon,
        roles: AUDITORIAL_ROLES,
        aurora: true,
      },
      {
        href: "/esteira-de-agentes",
        label: "Esteira de agentes",
        description: "Observabilidade dos agentes (FA01–FA11)",
        icon: WorkflowIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/cases",
        label: "Casos",
        description: "Gestão da fiscalização",
        icon: BriefcaseIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/comunicacoes",
        label: "Comunicações",
        description: "Central de notificações eletrônicas",
        icon: SendIcon,
        roles: AUDITORIAL_ROLES,
      },
      {
        href: "/citizen",
        label: "Cidadão",
        description: "Portal do contribuinte",
        icon: UsersIcon,
        roles: ["cidadao"] as const,
      },
    ],
  },
  {
    id: "supervisao",
    label: "Supervisão",
    items: [
      {
        href: "/analytics",
        label: "Painel do Gestor",
        description: "Metas, KPIs e relatórios",
        icon: BarChart3Icon,
        roles: ["supervisor", "admin"] as const,
      },
      {
        href: "/modelo-de-risco",
        label: "Modelo de risco",
        description: "Pesos, faixas e regras (T02)",
        icon: SlidersHorizontalIcon,
        roles: ["supervisor", "admin"] as const,
      },
      {
        href: "/compliance",
        label: "Governança",
        description: "Auditoria e LGPD",
        icon: ShieldCheckIcon,
        roles: ["admin", "supervisor"] as const,
      },
    ],
  },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const role = useSession((s) => s.role);
  const pathname = usePathname();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      role ? (item.roles as readonly Role[]).includes(role) : false,
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <nav
      aria-label="Navegação principal"
      data-slot="sidebar"
      className={cn(
        "flex h-full w-full flex-col gap-4 px-4 pb-5 pt-5 text-white",
        "bg-[linear-gradient(180deg,#071d41_0%,#0a2552_100%)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 px-2 pb-1">
        <Image
          src="/brand/logo-mark.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          priority
          className="size-10 shrink-0 drop-shadow-[0_4px_10px_rgba(25,211,232,0.35)]"
        />
        <div className="grid leading-none">
          <span className="font-display text-[16px] font-extrabold tracking-[-0.2px]">
            FiscalCheck<span className="text-[#19d3e8]"> AI</span>
          </span>
          <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#7e97c4]">
            Inteligência fiscal agêntica
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pt-1">
        {visibleSections.map((section) => (
          <div key={section.id} className="grid gap-1">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#5e78a8]">
              {section.label}
            </p>
            <ul className="grid gap-[3px]">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19d3e8]/60",
                        active
                          ? "bg-white/10 text-white"
                          : "text-[#c1cde3] hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r-full bg-[image:var(--grad-aurora)]"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
                          item.aurora
                            ? "bg-[image:var(--grad-aurora)] text-white shadow-[0_2px_8px_rgba(25,211,232,0.25)]"
                            : active
                              ? "bg-white/10 text-[#19d3e8]"
                              : "bg-white/[0.04] text-[#8ea3c9] group-hover:bg-white/10 group-hover:text-white",
                        )}
                      >
                        <Icon className="size-[18px]" />
                      </span>
                      <span className="grid gap-0.5 leading-tight">
                        <span className="text-[13px] font-semibold">{item.label}</span>
                        <span className="text-[11px] text-[#7e97c4]">{item.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-relaxed text-[#c1cde3]">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-white">
          <span
            aria-hidden="true"
            className="inline-block size-1.5 rounded-full bg-[#19d3e8] shadow-[0_0_0_3px_rgba(25,211,232,0.15)]"
          />
          Human-in-the-loop
        </p>
        <p className="text-[#8ea3c9]">
          Recomendações da IA sempre exigem decisão registrada de um auditor.
        </p>
      </div>
    </nav>
  );
}
