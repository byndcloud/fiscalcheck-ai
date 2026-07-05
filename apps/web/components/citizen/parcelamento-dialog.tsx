"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClockIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

import type { Caso, CitizenActionResponse, GuiaDam } from "@fiscalcheck/shared-types";

import { CURRENCY_BRL } from "@/components/citizen/case-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/api-client";
import { maxParcelasFor, simulateParcelamento } from "@/lib/citizen/parcelamento";
import { notify } from "@/lib/toast";

/*
  Simulador de parcelamento + adesão (T16 · módulo 4 · RF07).
  A simulação é local (função pura); somente a adesão chama o mock.
  A adesão gera protocolo, emite a guia da 1ª parcela e move o caso
  para autorregularização — devolutiva visível ao auditor (T14).
*/

type Props = {
  caso: Caso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuia: (guia: GuiaDam) => void;
};

export function ParcelamentoDialog({ caso, open, onOpenChange, onGuia }: Props) {
  const queryClient = useQueryClient();
  const [parcelas, setParcelas] = useState(6);

  const valorTotal = caso?.valorPotencial ?? 0;
  const maxParcelas = maxParcelasFor(valorTotal);
  const parcelasClamped = Math.min(parcelas, maxParcelas);
  const simulacao = simulateParcelamento(valorTotal, parcelasClamped);

  const adesao = useMutation({
    mutationFn: () =>
      apiRequest<CitizenActionResponse>(`/citizen/cases/${caso?.id}/parcelamento`, {
        method: "POST",
        body: { parcelas: parcelasClamped },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["citizen"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      notify.success("Adesão ao parcelamento confirmada.", {
        description: `Protocolo ${data.interacao.protocolo}. Guarde este número para acompanhamento.`,
      });
      onOpenChange(false);
      if (data.guia) onGuia(data.guia);
    },
  });

  if (!caso) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClockIcon aria-hidden className="size-4 text-brand" />
            Simular parcelamento
          </DialogTitle>
          <DialogDescription>
            Escolha em quantas vezes deseja regularizar. Sem juros neste ambiente de demonstração;
            parcela mínima de {CURRENCY_BRL.format(100)}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="parcelas-slider" className="text-sm font-medium text-text-strong">
                Número de parcelas
              </label>
              <span className="font-data text-sm font-semibold text-brand">
                {simulacao.parcelas}x
              </span>
            </div>
            <Slider
              id="parcelas-slider"
              min={1}
              max={maxParcelas}
              step={1}
              value={[parcelasClamped]}
              onValueChange={(value) => setParcelas(value[0] ?? 1)}
              aria-label="Número de parcelas"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>À vista</span>
              <span>{maxParcelas}x</span>
            </div>
          </div>

          <div className="grid gap-2 rounded-lg border border-border bg-n-25 p-4">
            <p className="text-xs text-muted-foreground">Sua simulação</p>
            <p className="font-display text-2xl text-text-strong">
              {simulacao.parcelas}x de {CURRENCY_BRL.format(simulacao.valorParcela)}
            </p>
            <dl className="grid gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <dt>Total a regularizar</dt>
                <dd className="font-mono text-text-strong">
                  {CURRENCY_BRL.format(simulacao.valorTotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Primeira parcela vence em</dt>
                <dd className="font-mono text-text-strong">
                  {new Date(`${simulacao.primeiroVencimento}T12:00:00Z`).toLocaleDateString(
                    "pt-BR",
                  )}
                </dd>
              </div>
              {simulacao.parcelas > 1 ? (
                <div className="flex justify-between">
                  <dt>Última parcela</dt>
                  <dd className="font-mono text-text-strong">
                    {CURRENCY_BRL.format(simulacao.valorUltimaParcela)} ·{" "}
                    {new Date(`${simulacao.ultimoVencimento}T12:00:00Z`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Voltar
            </Button>
            <Button size="sm" onClick={() => adesao.mutate()} disabled={adesao.isPending}>
              {adesao.isPending ? (
                <>
                  <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
                  Confirmando…
                </>
              ) : (
                "Aderir ao parcelamento"
              )}
            </Button>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Ao aderir, você receberá o protocolo e a guia da primeira parcela. A equipe da Fazenda
            será informada automaticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
