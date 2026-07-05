"use client";

import { ChevronRightIcon } from "lucide-react";

import type { Caso } from "@fiscalcheck/shared-types";

import {
  CITIZEN_STATUS_LABEL,
  CITIZEN_STATUS_TONE,
  CURRENCY_BRL,
  TRIBUTO_LABEL,
} from "@/components/citizen/case-labels";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

/*
  Card de pendência do Portal do Contribuinte (T16 · módulo 4).
  Resumo em linguagem clara + CTA único que abre o detalhe com o
  fluxo de regularização. Mobile-first: coluna única, CTA de largura
  total em telas pequenas.
*/

type Props = {
  caso: Caso;
  onOpen: (casoId: string) => void;
};

export function CitizenCaseCard({ caso, onOpen }: Props) {
  const encerrado = caso.status === "encerrado";
  const aguardandoCiencia = caso.status === "notificado";

  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface p-5 shadow-[var(--e-1)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase text-muted-foreground">
            {caso.id.toUpperCase()}
          </span>
          <StatusBadge
            kind="manual"
            tone={CITIZEN_STATUS_TONE[caso.status]}
            label={CITIZEN_STATUS_LABEL[caso.status]}
          />
        </div>
        {caso.prazoLimite && !encerrado ? (
          <span className="text-xs text-muted-foreground">
            Responder até{" "}
            <span className="font-mono font-semibold text-text-strong">
              {new Date(`${caso.prazoLimite}T12:00:00Z`).toLocaleDateString("pt-BR")}
            </span>
          </span>
        ) : null}
      </div>

      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-text-strong">
          {caso.tributo ? TRIBUTO_LABEL[caso.tributo] : "Pendência fiscal"}
          {caso.periodoApuracao ? (
            <span className="font-normal text-muted-foreground"> · {caso.periodoApuracao}</span>
          ) : null}
        </h3>
        {(caso.valorPotencial ?? 0) > 0 ? (
          <p className="text-sm text-foreground">
            Valor a regularizar:{" "}
            <span className="font-display text-base font-semibold text-text-strong">
              {CURRENCY_BRL.format(caso.valorPotencial ?? 0)}
            </span>
          </p>
        ) : null}
        {caso.observacoes ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{caso.observacoes}</p>
        ) : null}
      </div>

      <Button
        variant={aguardandoCiencia ? "default" : "secondary"}
        className="w-full sm:w-fit"
        onClick={() => onOpen(caso.id)}
      >
        {encerrado
          ? "Ver histórico"
          : aguardandoCiencia
            ? "Ver detalhes e regularizar"
            : "Acompanhar regularização"}
        <ChevronRightIcon aria-hidden className="size-4" />
      </Button>
    </article>
  );
}
