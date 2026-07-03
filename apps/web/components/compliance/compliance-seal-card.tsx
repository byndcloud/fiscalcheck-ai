import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  type LucideIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UserRoundXIcon,
} from "lucide-react";

import type {
  ComplianceSeal,
  ComplianceSealCode,
  ComplianceSealStatus,
} from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Card individual do selo de conformidade (T19 · módulo 6).

  Cada selo é um controle previsto no edital com status operacional
  visível. O ícone e a cor semântica dependem do STATUS (não do
  código), mantendo o padrão do DS (§3.3 — semantic tokens). RS08
  ganha um `IncidentCountdown` inline com o prazo restante.
*/

const CODE_ICON: Record<ComplianceSealCode, LucideIcon> = {
  tls_aes256: KeyRoundIcon,
  mfa: LockKeyholeIcon,
  segregacao: UserCogIcon,
  pseudonimizacao: UserRoundXIcon,
  lgpd_ctn: ScrollTextIcon,
  rs04_pentest: ShieldCheckIcon,
  rs09_retencao: ClockIcon,
  ripd: ScrollTextIcon,
};

const STATUS_LABEL: Record<ComplianceSealStatus, string> = {
  ok: "Operacional",
  atencao: "Requer atenção",
  pendente: "Pendente",
};

const STATUS_ICON: Record<ComplianceSealStatus, LucideIcon> = {
  ok: CheckCircle2Icon,
  atencao: AlertTriangleIcon,
  pendente: ClockIcon,
};

const STATUS_STYLES: Record<ComplianceSealStatus, { border: string; badge: string; icon: string }> =
  {
    ok: {
      border: "border-[color:var(--c-risk-1)]/35",
      badge:
        "bg-[color-mix(in_srgb,var(--c-risk-1)_14%,var(--surface))] text-[color:var(--c-risk-1)] border-[color-mix(in_srgb,var(--c-risk-1)_35%,transparent)]",
      icon: "text-[color:var(--c-risk-1)]",
    },
    atencao: {
      border: "border-[color:var(--c-warning)]/45",
      badge:
        "bg-[color-mix(in_srgb,var(--c-warning)_16%,var(--surface))] text-[color:var(--c-warning)] border-[color-mix(in_srgb,var(--c-warning)_35%,transparent)]",
      icon: "text-[color:var(--c-warning)]",
    },
    pendente: {
      border: "border-n-300",
      badge: "bg-n-50 text-text-muted border-border",
      icon: "text-text-muted",
    },
  };

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

function formatDateSafe(iso: string | undefined) {
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : DATE_FMT.format(parsed);
}

export function ComplianceSealCard({ seal }: { seal: ComplianceSeal }) {
  const CodeIcon = CODE_ICON[seal.code];
  const StatusIcon = STATUS_ICON[seal.status];
  const styles = STATUS_STYLES[seal.status];

  return (
    <article
      data-slot="compliance-seal-card"
      data-status={seal.status}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--r-lg)] border bg-surface p-4 shadow-[var(--e-1)]",
        styles.border,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-md bg-brand-050 text-brand",
              seal.status === "atencao" &&
                "bg-[color:var(--c-warning)]/12 text-[color:var(--c-warning)]",
              seal.status === "pendente" && "bg-n-100 text-text-muted",
            )}
          >
            <CodeIcon className="size-5" />
          </span>
          <div className="grid gap-0.5">
            <h3 className="text-[13px] font-semibold leading-tight text-text-strong">
              {seal.titulo}
            </h3>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {seal.code}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            styles.badge,
          )}
        >
          <StatusIcon aria-hidden="true" className={cn("size-3", styles.icon)} />
          {STATUS_LABEL[seal.status]}
        </span>
      </header>

      <p className="text-[13px] leading-snug text-text-muted">{seal.descricao}</p>

      {seal.evidencia ? (
        <p className="rounded-sm border border-dashed border-border bg-n-50/40 p-2 text-[11px] leading-snug text-text-muted">
          <span className="font-semibold text-text-strong">Evidência: </span>
          {seal.evidencia}
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {seal.ultimaVerificacao ? (
            <span>Verificado em {formatDateSafe(seal.ultimaVerificacao)}</span>
          ) : null}
          {seal.proximaRevisao ? (
            <span>Próxima revisão {formatDateSafe(seal.proximaRevisao)}</span>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
