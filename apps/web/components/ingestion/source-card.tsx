import type {
  ConnectorProtocol,
  ConnectorStatus,
  IntegrationSource,
} from "@fiscalcheck/shared-types";
import {
  ActivityIcon,
  CloudIcon,
  DatabaseIcon,
  FileJsonIcon,
  FileTextIcon,
  ServerIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { LgpdBadge } from "./lgpd-badge";

/*
  Card por fonte no painel de Integrações. Segue o padrão da referência
  visual: título + tipo pill, status dot, última carga (rel time),
  volume ingerido em Roboto Mono, pill LGPD quando pseudonimizado.
*/

const PROTOCOL_META: Record<ConnectorProtocol, { label: string; Icon: typeof FileTextIcon }> = {
  XML: { label: "XML", Icon: FileTextIcon },
  JSON: { label: "JSON", Icon: FileJsonIcon },
  CSV: { label: "CSV", Icon: FileTextIcon },
  API: { label: "API", Icon: CloudIcon },
  SFTP: { label: "SFTP", Icon: ServerIcon },
};

const STATUS_META: Record<ConnectorStatus, { label: string; dot: string; text: string }> = {
  online: {
    label: "Online",
    dot: "bg-[color:var(--c-risk-1)] shadow-[0_0_0_3px_rgba(22,136,33,0.18)]",
    text: "text-[color:var(--c-risk-1)]",
  },
  degradado: {
    label: "Degradado",
    dot: "bg-[color:var(--c-risk-3)] shadow-[0_0_0_3px_rgba(242,169,0,0.20)]",
    text: "text-[color:var(--c-risk-3)]",
  },
  offline: {
    label: "Offline",
    dot: "bg-[color:var(--c-risk-5)] shadow-[0_0_0_3px_rgba(197,22,11,0.18)]",
    text: "text-[color:var(--c-risk-5)]",
  },
};

const RELATIVE_TIME = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RELATIVE_TIME.format(diffSec, "second");
  if (abs < 3600) return RELATIVE_TIME.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RELATIVE_TIME.format(Math.round(diffSec / 3600), "hour");
  return RELATIVE_TIME.format(Math.round(diffSec / 86400), "day");
}

const VOLUME_FMT = new Intl.NumberFormat("pt-BR");

type SourceCardProps = {
  source: IntegrationSource;
};

export function SourceCard({ source }: SourceCardProps) {
  const protocol = PROTOCOL_META[source.protocolo];
  const status = STATUS_META[source.status];
  const ProtocolIcon = protocol.Icon;

  return (
    <article
      data-slot="source-card"
      data-status={source.status}
      className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--e-1)] transition-colors hover:border-brand-300/50"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-md bg-brand-050 text-brand"
          >
            <DatabaseIcon className="size-4" />
          </span>
          <div className="grid gap-0.5">
            <h3 className="text-sm font-semibold text-text-strong leading-tight">{source.nome}</h3>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ProtocolIcon aria-hidden="true" className="size-3" />
              {protocol.label}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-n-25 px-2 py-0.5 text-[11px] font-semibold",
            status.text,
          )}
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div className="grid gap-0.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Última carga
          </dt>
          <dd className="flex items-center gap-1 text-xs text-text-strong">
            <ActivityIcon aria-hidden="true" className="size-3 text-muted-foreground" />
            {formatRelative(source.ultimaCargaEm)}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Volume 24h
          </dt>
          <dd className="font-mono text-sm font-semibold text-text-strong">
            {VOLUME_FMT.format(source.volumeIngerido)}
          </dd>
        </div>
      </dl>

      {source.pseudonimizado ? (
        <footer>
          <LgpdBadge compact />
        </footer>
      ) : null}
    </article>
  );
}
