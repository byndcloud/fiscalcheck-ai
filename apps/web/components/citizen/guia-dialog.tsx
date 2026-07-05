"use client";

import { CopyIcon, ReceiptTextIcon } from "lucide-react";

import type { GuiaDam } from "@fiscalcheck/shared-types";

import { CURRENCY_BRL } from "@/components/citizen/case-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/lib/toast";

/*
  Guia de recolhimento mock — DAM (T16 · módulo 4).
  Exibida após "Emitir guia" ou como 1ª parcela da adesão ao
  parcelamento. A linha digitável é sintética (dado de demonstração).
*/

type Props = {
  guia: GuiaDam | null;
  onClose: () => void;
};

export function GuiaDialog({ guia, onClose }: Props) {
  async function copyLinhaDigitavel(linha: string) {
    try {
      await navigator.clipboard.writeText(linha);
      notify.success("Linha digitável copiada.");
    } catch {
      notify.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  return (
    <Dialog open={guia !== null} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        {guia ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ReceiptTextIcon aria-hidden className="size-4 text-brand" />
                Guia de recolhimento (DAM)
              </DialogTitle>
              <DialogDescription>
                {guia.descricao} · emitida em {new Date(guia.emitidaEm).toLocaleString("pt-BR")}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-n-25 p-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Número da guia</dt>
                <dd className="font-mono text-text-strong">{guia.numero}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Vencimento</dt>
                <dd className="font-mono text-text-strong">
                  {new Date(`${guia.vencimento}T12:00:00Z`).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Valor</dt>
                <dd className="font-display text-2xl text-text-strong">
                  {CURRENCY_BRL.format(guia.valor)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="mb-1 text-xs text-muted-foreground">Linha digitável</dt>
                <dd className="break-all rounded-md border border-border bg-surface p-2 font-mono text-xs text-text-strong">
                  {guia.linhaDigitavel}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyLinhaDigitavel(guia.linhaDigitavel)}
              >
                <CopyIcon aria-hidden className="size-3.5" />
                Copiar linha digitável
              </Button>
              <Button size="sm" onClick={onClose}>
                Concluir
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Guia gerada em ambiente de demonstração — não utilize para pagamento. Em produção, o
              DAM será integrado à arrecadação municipal.
            </p>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
