"use client";

import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";

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

/*
  Step-up MFA (T19 · micro-padrão do módulo 6).

  Reautenticação por TOTP obrigatória antes de qualquer mutação
  administrativa (criar/editar/desativar usuário). No mock, qualquer
  código de 6 dígitos é aceito — a UI só simula a fricção do fluxo
  real. Sempre que confirmado, o handler pai registra o evento
  `usuario.mfa.step_up` na trilha antes de completar a mutação
  principal.
*/

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
  isPending: boolean;
  actionLabel: string;
};

export function StepUpMfaDialog({
  open,
  onOpenChange,
  onConfirmed,
  isPending,
  actionLabel,
}: Props) {
  const [code, setCode] = useState("");
  const valid = /^\d{6}$/.test(code);

  useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!isPending ? onOpenChange(next) : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRoundIcon aria-hidden="true" className="size-5 text-brand" />
            Confirmação MFA obrigatória
          </DialogTitle>
          <DialogDescription>
            Reautentique-se para {actionLabel}. Insira o código de 6 dígitos do seu aplicativo
            autenticador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="mfa-code">Código TOTP</Label>
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            aria-invalid={code.length > 0 && !valid}
            className="font-data text-center text-lg tracking-widest"
          />
          <p className="text-[11px] text-muted-foreground">
            No mock, qualquer sequência de 6 dígitos é aceita. Em produção, exigirá TOTP real.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!valid || isPending}
            onClick={onConfirmed}
          >
            {isPending ? "Confirmando…" : "Confirmar MFA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
