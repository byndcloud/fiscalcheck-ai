"use client";

import { AlertTriangleIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { SimulationSummary } from "@/lib/risk-model/simulate";

/*
  Confirmação de publicação (T02 · módulo 3).
  Human-in-the-loop: o Gestor precisa (a) revisar a lista de campos
  alterados, (b) confirmar o impacto na fila e (c) escrever uma
  justificativa curta que fica no `summary` do RiskModelChange.
  Sem justificativa preenchida, o publish é bloqueado.
*/

type PublishConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justification: string) => void;
  isPublishing: boolean;
  fieldsChanged: readonly string[];
  fieldsLabels: Record<string, string>;
  summary: SimulationSummary;
  actorName: string;
  actorRoleLabel: string;
  errorMessage?: string | null;
};

export function PublishConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPublishing,
  fieldsChanged,
  fieldsLabels,
  summary,
  actorName,
  actorRoleLabel,
  errorMessage,
}: PublishConfirmDialogProps) {
  const [justification, setJustification] = useState("");
  const justificationId = useId();

  useEffect(() => {
    if (!open) setJustification("");
  }, [open]);

  const trimmed = justification.trim();
  const canConfirm = trimmed.length >= 10 && !isPublishing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheckIcon aria-hidden="true" className="size-5 text-brand" />
            Publicar nova versão do modelo
          </DialogTitle>
          <DialogDescription>
            A publicação é imutável — gera novo registro no histórico e no log de auditoria.
            Confirme o impacto antes de prosseguir.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 rounded-[var(--r-md)] border border-border/60 bg-n-25/60 p-3 text-[13px]">
            <p className="font-semibold text-text-strong">Resumo do impacto</p>
            <ul className="grid gap-1 text-text-default">
              <li>
                <span className="font-data font-semibold text-text-strong">
                  {summary.levelChangedCount}
                </span>{" "}
                de {summary.total} casos migrariam de faixa após a publicação.
              </li>
              <li>
                {fieldsChanged.length} campo{fieldsChanged.length === 1 ? "" : "s"} alterado
                {fieldsChanged.length === 1 ? "" : "s"} nesta versão.
              </li>
            </ul>
            {fieldsChanged.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {fieldsChanged.map((field) => (
                  <li
                    key={field}
                    className="rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {fieldsLabels[field] ?? field}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={justificationId}>
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <textarea
              id={justificationId}
              name="justification"
              rows={3}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              maxLength={280}
              placeholder="Ex.: aumentar peso do grafo para responder ao aumento de simulacros societários."
              className="w-full resize-none rounded-sm border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-[var(--e-1)] outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand-050"
              aria-describedby={`${justificationId}-hint`}
              disabled={isPublishing}
            />
            <p
              id={`${justificationId}-hint`}
              className="flex items-center justify-between text-[11px] text-muted-foreground"
            >
              <span>Mínimo 10 caracteres — registro obrigatório para auditoria.</span>
              <span className="font-data">{trimmed.length}/280</span>
            </p>
          </div>

          <div className="rounded-[var(--r-md)] border border-border/60 bg-surface p-3 text-[12px] text-text-muted">
            Publicando como <span className="font-semibold text-text-strong">{actorName}</span> ·{" "}
            {actorRoleLabel}. O registro ficará permanente.
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[var(--r-md)] border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive"
            >
              <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4" />
              <span>{errorMessage}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => onConfirm(trimmed)}
            disabled={!canConfirm}
          >
            {isPublishing ? (
              <>
                <Loader2Icon aria-hidden="true" className="animate-spin" />
                Publicando…
              </>
            ) : (
              "Publicar modelo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
