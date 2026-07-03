"use client";

import { AlertTriangleIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import type { Caso, DecisionAction } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/*
  Modal único de decisão (T13) — cobre `aprovar | ajustar | rejeitar`.

  Regras:
  - Step-up MFA obrigatório: 6 dígitos numéricos (mock leve — T26 troca
    pela implementação real, mesma interface).
  - `aprovar` exige checkbox "revisei as evidências".
  - `rejeitar` exige `justificativa` (>= 20 caracteres).
  - `ajustar` aceita observações opcionais.
  Nunca chama o handler sem passar por essas validações.
*/

type Payload = {
  action: DecisionAction;
  mfaCode: string;
  justificativa?: string;
  observacoes?: string;
};

type Props = {
  action: DecisionAction | null;
  caso: Caso;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: Payload) => Promise<void> | void;
};

const HEADLINE: Record<DecisionAction, string> = {
  aprovar: "Confirmar aprovação",
  rejeitar: "Rejeitar recomendação",
  ajustar: "Ajustar caso",
};

const HELPER: Record<DecisionAction, string> = {
  aprovar:
    "Aprovar move o caso para a próxima fase e, quando aplicável, emite o termo correspondente. Toda ação sobre o contribuinte exige MFA.",
  rejeitar:
    "Rejeitar devolve o caso para análise (ou encerra se estava em triagem). Informe uma justificativa para a cadeia decisória.",
  ajustar:
    "Ajustar mantém o caso no status atual — usado para registrar observações e reabrir a análise sem alterar o workflow.",
};

const CONFIRM_LABEL: Record<DecisionAction, string> = {
  aprovar: "Aprovar e emitir",
  rejeitar: "Rejeitar caso",
  ajustar: "Registrar ajuste",
};

const CONFIRM_VARIANT: Record<DecisionAction, "aurora" | "destructive" | "default"> = {
  aprovar: "aurora",
  rejeitar: "destructive",
  ajustar: "default",
};

export function ApprovalModal({ action, caso, submitting, onCancel, onConfirm }: Props) {
  const open = action !== null;
  const [mfaCode, setMfaCode] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mfaFieldId = useId();
  const justificativaFieldId = useId();
  const observacoesFieldId = useId();
  const reviewedFieldId = useId();

  useEffect(() => {
    if (!open) return;
    setMfaCode("");
    setJustificativa("");
    setObservacoes("");
    setReviewed(false);
    setError(null);
  }, [open]);

  if (!action) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/u.test(mfaCode)) {
      setError("Informe os 6 dígitos do MFA.");
      return;
    }
    if (action === "aprovar" && !reviewed) {
      setError("Confirme que revisou as evidências antes de aprovar.");
      return;
    }
    if (action === "rejeitar" && justificativa.trim().length < 20) {
      setError("A justificativa da rejeição precisa de pelo menos 20 caracteres.");
      return;
    }
    setError(null);
    await onConfirm({
      action,
      mfaCode,
      justificativa: action === "rejeitar" ? justificativa.trim() : undefined,
      observacoes: action === "ajustar" ? observacoes.trim() || undefined : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
            <ShieldCheckIcon aria-hidden className="size-3.5" /> Step-up MFA obrigatório
          </span>
          <DialogTitle>{HEADLINE[action]}</DialogTitle>
          <DialogDescription>
            Caso <span className="font-mono text-text-strong">{caso.id.toUpperCase()}</span> ·
            contribuinte {caso.contribuinteId}. {HELPER[action]}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={mfaFieldId}>Código MFA</Label>
            <Input
              id={mfaFieldId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\\d{6}"
              placeholder="000000"
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replace(/\D/gu, ""))}
              aria-describedby={`${mfaFieldId}-help`}
              className="font-mono tracking-widest"
              required
            />
            <p id={`${mfaFieldId}-help`} className="text-xs text-muted-foreground">
              Simulação POC: qualquer 6 dígitos numéricos validam o step-up.
            </p>
          </div>

          {action === "rejeitar" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={justificativaFieldId}>Justificativa da rejeição</Label>
              <textarea
                id={justificativaFieldId}
                value={justificativa}
                onChange={(event) => setJustificativa(event.target.value)}
                rows={3}
                minLength={20}
                required
                className={cn(
                  "min-h-[80px] w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-[var(--e-1)] outline-none transition-colors",
                  "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-050",
                )}
                placeholder="Explique por que a recomendação foi rejeitada (mínimo 20 caracteres)."
              />
            </div>
          ) : null}

          {action === "ajustar" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={observacoesFieldId}>Observações (opcional)</Label>
              <textarea
                id={observacoesFieldId}
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                rows={3}
                className={cn(
                  "min-h-[80px] w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-[var(--e-1)] outline-none transition-colors",
                  "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-050",
                )}
                placeholder="Registre o que precisa ser refeito antes da próxima decisão."
              />
            </div>
          ) : null}

          {action === "aprovar" ? (
            <label htmlFor={reviewedFieldId} className="flex items-start gap-2 text-xs">
              <input
                id={reviewedFieldId}
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
                className="mt-0.5 size-4 rounded border-input text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-050"
              />
              <span className="text-muted-foreground">
                Confirmo que revisei evidências, score e cadeia decisória antes de aprovar.
              </span>
            </label>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
            >
              <AlertTriangleIcon aria-hidden className="mt-0.5 size-4" />
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={CONFIRM_VARIANT[action]}
              disabled={submitting}
              size="default"
            >
              {submitting ? "Registrando…" : CONFIRM_LABEL[action]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
