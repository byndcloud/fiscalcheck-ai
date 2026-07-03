import { CheckCircle2Icon, PencilIcon, ShieldCheckIcon, XCircleIcon } from "lucide-react";

import type { CaseDecision, DecisionAction, Role } from "@fiscalcheck/shared-types";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

/*
  Linha da cadeia decisória (T13). Renderizada dentro do dossiê em uma
  `ol` — ordem descendente por timestamp. Estrutura imutável: quem, quando,
  o quê, transição de status, justificativa, MFA validado.
*/

type Props = {
  decision: CaseDecision;
};

const ACTION_META: Record<
  DecisionAction,
  { label: string; Icon: typeof CheckCircle2Icon; tone: string }
> = {
  aprovar: { label: "Aprovou", Icon: CheckCircle2Icon, tone: "text-risk-1" },
  ajustar: { label: "Ajustou", Icon: PencilIcon, tone: "text-brand" },
  rejeitar: { label: "Rejeitou", Icon: XCircleIcon, tone: "text-destructive" },
};

const ROLE_LABEL_PT: Record<Role, string> = {
  auditor: "Auditor",
  supervisor: "Gestor / Supervisor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};

function formatFull(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString("pt-BR")} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

function relative(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `há ${diffD} d`;
}

export function DecisionChainEntry({ decision }: Props) {
  const meta = ACTION_META[decision.action];
  const Icon = meta.Icon;
  return (
    <li className="flex gap-3 rounded-md border border-border bg-surface p-3 shadow-[var(--e-1)]">
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-n-25",
          meta.tone,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-text-strong">
            {meta.label}{" "}
            <span className="text-muted-foreground">
              · {decision.atorNome} ({ROLE_LABEL_PT[decision.atorPapel]})
            </span>
          </p>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatFull(decision.timestamp)} · {relative(decision.timestamp)}
          </span>
        </header>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge kind="status" status={decision.statusAnterior} />
          <span aria-hidden className="text-muted-foreground">
            →
          </span>
          <StatusBadge kind="status" status={decision.statusPosterior} />
          {decision.mfaVerified ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-050 px-2 py-0.5 text-[10px] font-medium text-brand"
              title="Step-up MFA validado"
            >
              <ShieldCheckIcon aria-hidden className="size-3" /> MFA verificado
            </span>
          ) : null}
        </div>
        {decision.justificativa ? (
          <p className="text-xs italic text-muted-foreground">
            &ldquo;{decision.justificativa}&rdquo;
          </p>
        ) : null}
        {decision.documentoGerado ? (
          <p className="font-mono text-[11px] text-brand">
            Documento anexado: {decision.documentoGerado}
          </p>
        ) : null}
      </div>
    </li>
  );
}
