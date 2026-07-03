"use client";

import { CheckCircle2Icon, PencilIcon, SparklesIcon, XCircleIcon } from "lucide-react";

import type { Caso } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
  Painel "Próxima melhor ação" (T13 — módulo 4).

  - Gradiente `--grad-aurora`: marca visual de conteúdo assistido por
    IA (DS §7 · aurora).
  - Legenda "Human-in-the-loop" reforça que o auditor decide (AGENTS §1.1).
  - 3 CTAs: Aprovar (aurora), Ajustar (secondary), Rejeitar (ghost + tom
    destrutivo) — nenhuma decisão sai daqui sem passar pelo ApprovalModal
    com step-up MFA.
*/

type Props = {
  caso: Caso;
  onApprove: () => void;
  onAdjust: () => void;
  onReject: () => void;
  disabled?: boolean;
};

const ACAO_LABEL_PT: Record<string, string> = {
  intimacao: "Emitir termo de intimação",
  autorregularizacao: "Encaminhar para autorregularização",
  fiscalizacao: "Emitir termo de início de fiscalização",
};

export function NextActionPanel({ caso, onApprove, onAdjust, onReject, disabled }: Props) {
  const recomendacao = caso.recomendacao;
  const confianca = Math.round((recomendacao?.confianca ?? 0) * 100);
  const acaoLabel = recomendacao ? (ACAO_LABEL_PT[recomendacao.acao] ?? recomendacao.acao) : null;
  const encerrado = caso.status === "encerrado";

  return (
    <section
      aria-label="Próxima melhor ação recomendada"
      className={cn(
        "relative overflow-hidden rounded-lg p-5 text-white shadow-[var(--e-2)]",
        "bg-[image:var(--grad-aurora)]",
      )}
    >
      <div className="absolute inset-0 bg-black/10" aria-hidden />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
              <SparklesIcon aria-hidden className="size-3.5" /> Próxima melhor ação
            </span>
            <h3 className="text-lg font-semibold leading-tight">
              {acaoLabel ?? "Sem recomendação do agente"}
            </h3>
            <p className="text-xs text-white/80">
              Human-in-the-loop · a decisão final é do auditor autenticado.
            </p>
          </div>
          {recomendacao ? (
            <div
              className="flex flex-col items-end text-right text-xs text-white/80"
              aria-label="Confiança do agente"
            >
              <span className="font-semibold text-white">{confianca}%</span>
              <span>confiança</span>
              <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white" style={{ width: `${confianca}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        {recomendacao?.justificativa ? (
          <p className="text-sm leading-relaxed text-white/90">{recomendacao.justificativa}</p>
        ) : null}

        {recomendacao?.baseadaEm && recomendacao.baseadaEm.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs uppercase tracking-wide text-white/70">Baseada em</span>
            {recomendacao.baseadaEm.map((id) => (
              <span
                key={id}
                className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white"
              >
                {id}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="aurora"
            size="sm"
            onClick={onApprove}
            disabled={disabled || encerrado}
            className="bg-white/90 !bg-none text-brand shadow-none hover:bg-white"
          >
            <CheckCircle2Icon aria-hidden />
            Aprovar e emitir
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onAdjust}
            disabled={disabled || encerrado}
            className="border-white/60 bg-transparent text-white hover:bg-white/10"
          >
            <PencilIcon aria-hidden />
            Ajustar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReject}
            disabled={disabled || encerrado}
            className="text-white hover:bg-white/10"
          >
            <XCircleIcon aria-hidden className="text-white" />
            Rejeitar
          </Button>
        </div>
        {encerrado ? (
          <p className="text-xs text-white/70">
            Caso encerrado — nenhuma nova decisão pode ser registrada.
          </p>
        ) : null}
      </div>
    </section>
  );
}
