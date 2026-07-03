"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, Loader2Icon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import type { AtypicalAccess, AuditLogEntry, ComplianceSeal } from "@fiscalcheck/shared-types";

import { AgentPanel } from "@/components/compliance/agent-panel";
import { ComplianceSealsGrid } from "@/components/compliance/compliance-seals-grid";
import { OverviewQuickNav } from "@/components/compliance/overview-quick-nav";
import { RoleBadge } from "@/components/compliance/role-badge";
import { SigiloBanner } from "@/components/compliance/sigilo-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { maskIp } from "@/lib/masks";
import { type AUDITOR_ROLES, ROLE_LABEL_PT } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Página /compliance (T19 · módulo 6 — visão geral).

  Perfis autorizados: Admin (leitura+ação) e Supervisor (leitura pura).
  Auditor Fiscal e Cidadão são bloqueados via ForbiddenNotice — a
  sidebar já esconde o item para eles; este guard é defense-in-depth.

  Combina: SigiloBanner + selos + agente de conformidade + últimas
  ações da trilha + navegação para sub-rotas admin.
*/

const OVERVIEW_ROLES = ["admin", "supervisor"] as const;

export default function ComplianceOverviewPage() {
  const role = useSession((s) => s.role);
  const isAdmin = role === "admin";
  const canView = role ? (OVERVIEW_ROLES as readonly string[]).includes(role) : false;

  const sealsQuery = useQuery({
    queryKey: ["compliance", "seals"],
    queryFn: () => apiRequest<ComplianceSeal[]>("/compliance/seals"),
    enabled: canView,
  });
  const atypicalQuery = useQuery({
    queryKey: ["compliance", "atypical-accesses"],
    queryFn: () => apiRequest<AtypicalAccess[]>("/compliance/atypical-accesses"),
    enabled: canView,
  });
  const auditQuery = useQuery({
    queryKey: ["compliance", "audit-log-v2", { view: "overview" }],
    queryFn: () => apiRequest<AuditLogEntry[]>("/compliance/audit-log-v2"),
    enabled: canView,
  });

  const lastFive = useMemo(() => (auditQuery.data ?? []).slice(0, 5), [auditQuery.data]);
  const anyLoading = sealsQuery.isLoading || atypicalQuery.isLoading || auditQuery.isLoading;
  const anyError = sealsQuery.isError || atypicalQuery.isError || auditQuery.isError;

  if (!canView) {
    return (
      <div className="grid gap-5">
        <PageHeader
          title="Governança e conformidade"
          description="Painel do Módulo 6 — selos, trilha de auditoria e cadastro operacional."
        />
        <ForbiddenNotice roleLabel={role ? ROLE_LABEL_PT[role] : "Perfil desconhecido"} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Governança e conformidade"
        description="Selos dos controles, painel do Agente de Conformidade e atalhos para a trilha completa e o cadastro de usuários. Módulo 6."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-050 px-3 py-1 text-[11px] font-medium text-brand-deep">
            Perfil ativo · {role ? ROLE_LABEL_PT[role] : ""}
          </span>
        }
      />

      <SigiloBanner />

      {anyLoading ? (
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-[var(--r-md)] border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
        >
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
          Carregando painel de conformidade…
        </output>
      ) : anyError ? (
        <ErrorNotice
          onRetry={() => {
            sealsQuery.refetch();
            atypicalQuery.refetch();
            auditQuery.refetch();
          }}
        />
      ) : (
        <>
          <section aria-label="Selos de conformidade" className="grid gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-text-strong">Selos dos controles</h2>
              <span className="text-[11px] text-muted-foreground">
                {sealsQuery.data?.length ?? 0} controles monitorados
              </span>
            </div>
            <ComplianceSealsGrid seals={sealsQuery.data ?? []} />
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <AgentPanel accesses={atypicalQuery.data ?? []} canAct={isAdmin} />
            <RecentActivity entries={lastFive} />
          </div>

          {isAdmin ? <OverviewQuickNav /> : null}
        </>
      )}
    </div>
  );
}

function RecentActivity({ entries }: { entries: readonly AuditLogEntry[] }) {
  return (
    <section
      aria-label="Últimas ações da trilha"
      className="grid gap-3 rounded-[var(--r-lg)] border border-border bg-surface p-4 shadow-[var(--e-1)]"
    >
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-text-strong">Últimas ações</h2>
        <Link
          href="/compliance/trilha"
          className="text-[11px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Ver trilha completa →
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="Sem eventos recentes"
          description="Assim que houver atividade nas próximas horas, ela aparecerá aqui."
        />
      ) : (
        <ol className="grid gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "grid gap-1 rounded-[var(--r-md)] border p-2.5 text-[12px]",
                entry.atypical
                  ? "border-[color:var(--c-danger)]/35 bg-[color-mix(in_srgb,var(--c-danger)_8%,var(--surface))]"
                  : "border-border bg-surface",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <code
                  className={cn(
                    "font-data text-[12px]",
                    entry.atypical
                      ? "font-semibold text-[color:var(--c-danger)]"
                      : "text-text-strong",
                  )}
                >
                  {entry.action}
                </code>
                <RoleBadge role={entry.actorRole} className="text-[10px]" />
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                <span className="font-medium text-text-strong">{entry.actorName}</span> ·{" "}
                {entry.details}
              </p>
              <p className="font-data text-[10px] text-muted-foreground">
                IP {maskIp(entry.ipAddress)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ForbiddenNotice({ roleLabel }: { roleLabel: string }) {
  const allowed = OVERVIEW_ROLES.map(
    (r) => ROLE_LABEL_PT[r as (typeof AUDITOR_ROLES)[number]],
  ).join(" ou ");
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title={`Área restrita a ${allowed}`}
      description={`O perfil atual (${roleLabel}) não tem permissão para acessar o painel de Governança. Solicite acesso ao Administrador responsável.`}
    />
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--r-md)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-5" />
        <div className="grid gap-1">
          <p className="font-semibold">Não foi possível carregar o painel de conformidade.</p>
          <p className="text-xs">
            Verifique sua conexão com a API mock e tente novamente. Nenhum dado foi alterado.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
