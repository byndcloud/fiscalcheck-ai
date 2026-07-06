"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  HistoryIcon,
  LightbulbIcon,
  Loader2Icon,
  SparklesIcon,
  UserRoundIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import type {
  DecisionAction,
  TrainingAttemptResult,
  TrainingCase,
} from "@fiscalcheck/shared-types";

import { TrainingBanner } from "@/components/training/training-banner";
import {
  DECISAO_LABEL,
  DECISAO_LABEL_CURTA,
  TIPO_DIVERGENCIA_LABEL,
} from "@/components/training/training-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

/*
  Exercício de decisão do Ambiente de Treinamento (T20 · módulo 6).

  Fluxo didático em 2 tempos:
  1. o auditor em formação lê o caso anonimizado, escolhe a decisão e
     JUSTIFICA (obrigatório — treinar a motivação do ato faz parte);
  2. só então o gabarito é revelado: "sua decisão × decisão histórica",
     com o desfecho real do caso e o aprendizado a levar.
*/

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ACTIONS: readonly DecisionAction[] = ["aprovar", "ajustar", "rejeitar"] as const;

type Props = {
  exercise: TrainingCase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TrainingCaseSheet({ exercise, open, onOpenChange }: Props) {
  if (!exercise) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-8">{exercise.titulo}</SheetTitle>
          <SheetDescription>
            Exercício {exercise.id.toUpperCase()} ·{" "}
            {TIPO_DIVERGENCIA_LABEL[exercise.divergencia.tipo]}
          </SheetDescription>
        </SheetHeader>

        {/* key por exercício: zera formulário e mutation ao trocar de caso */}
        <ExerciseBody key={exercise.id} exercise={exercise} />
      </SheetContent>
    </Sheet>
  );
}

function ExerciseBody({ exercise }: { exercise: TrainingCase }) {
  const queryClient = useQueryClient();
  const [acao, setAcao] = useState<DecisionAction | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const attempt = useMutation({
    mutationFn: (body: { acao: DecisionAction; justificativa: string }) =>
      apiRequest<TrainingAttemptResult>(`/training/cases/${exercise.id}/attempt`, {
        method: "POST",
        body,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
      if (data.acertou) {
        notify.success("Decisão alinhada ao gabarito.", {
          description: "Compare as justificativas para consolidar o raciocínio.",
        });
      } else {
        notify.info("Sua decisão divergiu do gabarito.", {
          description: "Errar aqui é o objetivo do treino — veja o que o histórico ensina.",
        });
      }
    },
  });

  const resultado = attempt.data ?? exercise.tentativa ?? null;

  function handleSubmit() {
    if (!acao) {
      setFormError("Escolha uma das três decisões antes de registrar.");
      return;
    }
    if (justificativa.trim().length < 20) {
      setFormError("Justifique sua decisão com pelo menos 20 caracteres — faz parte do exercício.");
      return;
    }
    setFormError(null);
    attempt.mutate({ acao, justificativa: justificativa.trim() });
  }

  return (
    <div className="grid gap-5 px-4 pb-6">
      <TrainingBanner compact />

      {/* Contribuinte anonimizado */}
      <section aria-label="Contribuinte do exercício" className="grid gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contribuinte (anonimizado)
        </h4>
        <div className="rounded-[var(--r-md)] border border-border bg-n-25 p-3 text-sm">
          <p className="font-semibold text-text-strong">{exercise.contribuinte.codinome}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            CNPJ <span className="font-data">{exercise.contribuinte.cnpjMascarado}</span> ·{" "}
            {exercise.contribuinte.atividade} · {exercise.contribuinte.regime}
          </p>
        </div>
      </section>

      {/* Contexto do caso */}
      <section aria-label="Contexto do caso" className="grid gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O caso
        </h4>
        <p className="text-sm leading-relaxed text-foreground">{exercise.contexto}</p>
        <dl className="grid grid-cols-2 gap-3 rounded-[var(--r-md)] border border-border bg-surface p-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Declarado</dt>
            <dd className="font-data text-sm font-semibold text-text-strong">
              {BRL.format(exercise.divergencia.valorDeclarado)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Apurado</dt>
            <dd className="font-data text-sm font-semibold text-text-strong">
              {BRL.format(exercise.divergencia.valorApurado)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Competência
            </dt>
            <dd className="font-data text-sm font-semibold text-text-strong">
              {exercise.divergencia.competencia}
            </dd>
          </div>
        </dl>
      </section>

      {/* Score e fatores */}
      <section aria-label="Score e fatores" className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Score e fatores
          </h4>
          <span className="font-data text-sm font-semibold text-text-strong">
            {exercise.scoreValor}
            <span className="text-xs font-normal text-muted-foreground"> / 100</span>
          </span>
        </div>
        <ul className="grid gap-1.5">
          {exercise.fatoresResumo.map((fator) => (
            <li key={fator} className="flex items-start gap-2 text-sm text-foreground">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              {fator}
            </li>
          ))}
        </ul>
      </section>

      {/* Recomendação do agente */}
      <section
        aria-label="Recomendação do agente"
        className="rounded-[var(--r-md)] border border-brand-100 bg-brand-050 p-3"
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-deep">
          <SparklesIcon aria-hidden="true" className="size-3.5" />
          Recomendação do agente
        </p>
        <p className="mt-1.5 text-sm text-text-strong">{exercise.recomendacaoAgente}</p>
      </section>

      {resultado ? (
        <ResultadoPanel resultado={resultado} />
      ) : (
        <section aria-label="Sua decisão" className="grid gap-3 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Qual seria a sua decisão?
          </h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {ACTIONS.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setAcao(action);
                  setFormError(null);
                }}
                aria-pressed={acao === action}
                className={cn(
                  "rounded-[var(--r-md)] border p-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  acao === action
                    ? "border-brand bg-brand-050 text-brand-deep"
                    : "border-border bg-surface text-foreground hover:border-brand-100 hover:bg-n-25",
                )}
              >
                {DECISAO_LABEL[action]}
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="training-justificativa">Justificativa (mínimo 20 caracteres)</Label>
            <Textarea
              id="training-justificativa"
              rows={4}
              value={justificativa}
              onChange={(event) => {
                setJustificativa(event.target.value);
                setFormError(null);
              }}
              placeholder="Motive sua decisão como faria num caso real: quais evidências pesaram e qual a medida proporcional?"
            />
          </div>
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={attempt.isPending}
            className="justify-self-start"
          >
            {attempt.isPending ? (
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Registrar decisão e ver gabarito
          </Button>
        </section>
      )}
    </div>
  );
}

/*
  Comparativo "sua decisão × decisão histórica" — coração didático do
  exercício (aceite do T20).
*/
function ResultadoPanel({ resultado }: { resultado: TrainingAttemptResult }) {
  return (
    <section
      aria-label="Sua decisão × decisão histórica"
      className="grid gap-3 border-t border-border pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sua decisão × decisão histórica
        </h4>
        {resultado.acertou ? (
          <Badge variant="success">
            <CheckCircle2Icon aria-hidden="true" />
            Alinhado ao gabarito
          </Badge>
        ) : (
          <Badge variant="warning">
            <XCircleIcon aria-hidden="true" />
            Divergiu do gabarito
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-[var(--r-md)] border border-border bg-surface p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <UserRoundIcon aria-hidden="true" className="size-3.5" />
            Sua decisão
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-strong">
            {DECISAO_LABEL_CURTA[resultado.suaDecisao.acao]}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {resultado.suaDecisao.justificativa}
          </p>
        </article>

        <article className="rounded-[var(--r-md)] border border-brand-100 bg-brand-050 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-deep">
            <HistoryIcon aria-hidden="true" className="size-3.5" />
            Decisão histórica
          </p>
          <p className="mt-1.5 text-sm font-semibold text-text-strong">
            {DECISAO_LABEL_CURTA[resultado.gabarito.acao]}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-foreground">
            {resultado.gabarito.justificativa}
          </p>
        </article>
      </div>

      <div className="rounded-[var(--r-md)] border border-border bg-n-25 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          O que aconteceu no caso real
        </p>
        <p className="mt-1 text-sm text-foreground">{resultado.gabarito.resultado}</p>
      </div>

      <div className="flex items-start gap-2 rounded-[var(--r-md)] border border-[color:var(--c-warning)]/50 bg-[color-mix(in_srgb,var(--c-warning)_10%,var(--surface))] p-3">
        <LightbulbIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[color:var(--c-risk-3-txt)]"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--c-risk-3-txt)]">
            O que levar deste exercício
          </p>
          <p className="mt-1 text-sm text-foreground">{resultado.aprendizado}</p>
        </div>
      </div>
    </section>
  );
}
