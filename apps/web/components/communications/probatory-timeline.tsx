import {
  AlertCircleIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  EyeIcon,
  type LucideIcon,
  RotateCwIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";

import type { EventoProbatorio, TipoEventoProbatorio } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Timeline probatória (T15). Cada evento é uma linha imutável com
  hash sintético + IP/UA pseudonimizados. A UI enfatiza que essa
  cadeia é a prova jurídica da comunicação — não pode ser editada.
*/

type Props = {
  eventos: EventoProbatorio[];
  className?: string;
};

const EVENT_META: Record<
  TipoEventoProbatorio,
  { label: string; Icon: LucideIcon; toneClass: string; bgClass: string }
> = {
  envio: {
    label: "Envio registrado",
    Icon: SendIcon,
    toneClass: "text-brand",
    bgClass: "bg-brand-050",
  },
  entrega: {
    label: "Entrega confirmada",
    Icon: CheckCircle2Icon,
    toneClass: "text-[color:var(--c-risk-3)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-3)_14%,var(--surface))]",
  },
  abertura: {
    label: "Comunicação aberta",
    Icon: EyeIcon,
    toneClass: "text-brand",
    bgClass: "bg-brand-050",
  },
  ciencia_registrada: {
    label: "Ciência formal registrada",
    Icon: ShieldCheckIcon,
    toneClass: "text-[color:var(--c-risk-2)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-2)_18%,var(--surface))]",
  },
  resposta_recebida: {
    label: "Resposta recebida",
    Icon: CheckCheckIcon,
    toneClass: "text-[color:var(--c-risk-1)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-1)_16%,var(--surface))]",
  },
  reenvio: {
    label: "Reenvio realizado",
    Icon: RotateCwIcon,
    toneClass: "text-brand",
    bgClass: "bg-brand-050",
  },
  falha_temporaria: {
    label: "Falha temporária no canal",
    Icon: AlertCircleIcon,
    toneClass: "text-[color:var(--c-risk-5)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-5)_14%,var(--surface))]",
  },
};

function formatFull(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString("pt-BR")} · ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

export function ProbatoryTimeline({ eventos, className }: Props) {
  const ordered = [...eventos].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  if (ordered.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Nenhum evento probatório registrado ainda.
      </p>
    );
  }

  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {ordered.map((evento, index) => {
        const meta = EVENT_META[evento.tipo];
        const Icon = meta.Icon;
        const isLast = index === ordered.length - 1;
        return (
          <li key={evento.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  meta.bgClass,
                  meta.toneClass,
                )}
              >
                <Icon className="size-4" />
              </span>
              {!isLast ? <span aria-hidden="true" className="w-[2px] flex-1 bg-n-100" /> : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pb-3">
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-text-strong">{meta.label}</p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatFull(evento.timestamp)}
                </span>
              </header>
              {evento.detalhes ? (
                <p className="text-xs text-muted-foreground">{evento.detalhes}</p>
              ) : null}
              <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 rounded-md border border-border bg-n-25/60 px-3 py-2 text-[11px] sm:grid-cols-2">
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Hash do payload</dt>
                  <dd className="truncate font-mono text-text-strong" title={evento.hashConteudo}>
                    {evento.hashConteudo.slice(0, 24)}…
                  </dd>
                </div>
                {evento.ipOrigem ? (
                  <div className="flex flex-col">
                    <dt className="text-muted-foreground">IP de origem</dt>
                    <dd className="font-mono text-foreground">{evento.ipOrigem}</dd>
                  </div>
                ) : null}
                {evento.userAgent ? (
                  <div className="col-span-full flex flex-col">
                    <dt className="text-muted-foreground">User agent</dt>
                    <dd className="truncate font-mono text-foreground" title={evento.userAgent}>
                      {evento.userAgent}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
