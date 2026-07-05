import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CitizenStep } from "./case-labels";

/*
  Stepper acolhedor de 3 passos do Portal do Contribuinte (T16).
  Mobile-first: rótulos abaixo dos círculos, linha conectora flexível.
  Semântica de lista ordenada + aria-current para leitores de tela
  (eMAG/WCAG — requisito do edital).
*/

const STEPS: readonly { numero: CitizenStep; titulo: string; descricao: string }[] = [
  { numero: 1, titulo: "Ciência", descricao: "Você confirma que recebeu o aviso" },
  {
    numero: 2,
    titulo: "Regularização",
    descricao: "Escolha como resolver: guia, parcelas ou contestação",
  },
  { numero: 3, titulo: "Confirmação", descricao: "A Fazenda confirma e encerra a pendência" },
];

type Props = {
  current: CitizenStep;
  done?: boolean;
  className?: string;
};

export function CitizenStepper({ current, done = false, className }: Props) {
  return (
    <ol className={cn("flex items-start gap-1", className)} aria-label="Etapas da regularização">
      {STEPS.map((step, index) => {
        const completed = done || step.numero < current;
        const active = !done && step.numero === current;
        return (
          <li
            key={step.numero}
            aria-current={active ? "step" : undefined}
            className="flex flex-1 flex-col items-center gap-1.5 text-center"
          >
            <div className="flex w-full items-center">
              <span
                aria-hidden
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  index === 0 ? "bg-transparent" : completed || active ? "bg-brand" : "bg-n-100",
                )}
              />
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                  completed
                    ? "border-brand bg-brand text-white"
                    : active
                      ? "border-brand bg-brand-050 text-brand"
                      : "border-n-200 bg-surface text-muted-foreground",
                )}
              >
                {completed ? <CheckIcon aria-hidden className="size-4" /> : step.numero}
              </span>
              <span
                aria-hidden
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  index === STEPS.length - 1
                    ? "bg-transparent"
                    : completed
                      ? "bg-brand"
                      : "bg-n-100",
                )}
              />
            </div>
            <div className="grid gap-0.5 px-1">
              <span
                className={cn(
                  "text-xs font-semibold",
                  active || completed ? "text-text-strong" : "text-muted-foreground",
                )}
              >
                {step.titulo}
              </span>
              <span className="hidden text-[11px] leading-snug text-muted-foreground sm:block">
                {step.descricao}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
