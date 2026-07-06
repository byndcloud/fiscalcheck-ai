"use client";

import { CheckCircle2Icon, CircleDashedIcon, XCircleIcon } from "lucide-react";

import type { TrainingCase } from "@fiscalcheck/shared-types";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  DIFICULDADE_BADGE_VARIANT,
  DIFICULDADE_LABEL,
  TIPO_DIVERGENCIA_LABEL,
} from "./training-labels";

/*
  Card de exercício da biblioteca de treinamento (T20 · módulo 6).
  O contribuinte só aparece por codinome + CNPJ mascarado (RSC04).
*/

type TrainingCaseCardProps = {
  exercise: TrainingCase;
  onOpen: (id: string) => void;
};

export function TrainingCaseCard({ exercise, onOpen }: TrainingCaseCardProps) {
  const concluido = Boolean(exercise.tentativa);
  const acertou = exercise.tentativa?.acertou ?? false;

  return (
    <button
      type="button"
      onClick={() => onOpen(exercise.id)}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-[var(--e-1)]",
        "transition-shadow hover:shadow-[var(--e-2)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={DIFICULDADE_BADGE_VARIANT[exercise.dificuldade]}>
          {DIFICULDADE_LABEL[exercise.dificuldade]}
        </Badge>
        <Badge variant="outline">{TIPO_DIVERGENCIA_LABEL[exercise.divergencia.tipo]}</Badge>
      </div>

      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-text-strong group-hover:text-brand">
          {exercise.titulo}
        </h3>
        <p className="text-xs text-muted-foreground">
          {exercise.contribuinte.codinome} ·{" "}
          <span className="font-data">{exercise.contribuinte.cnpjMascarado}</span> ·{" "}
          {exercise.contribuinte.atividade}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="font-data text-xs text-muted-foreground">
          Score {exercise.scoreValor}/100
        </span>
        {concluido ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
              acertou ? "text-[color:var(--c-risk-1-txt)]" : "text-[color:var(--c-risk-4-txt)]",
            )}
          >
            {acertou ? (
              <CheckCircle2Icon aria-hidden="true" className="size-3.5" />
            ) : (
              <XCircleIcon aria-hidden="true" className="size-3.5" />
            )}
            {acertou ? "Alinhado ao gabarito" : "Divergiu do gabarito"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CircleDashedIcon aria-hidden="true" className="size-3.5" />
            Pendente
          </span>
        )}
      </div>
    </button>
  );
}
