"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertOctagonIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { AtypicalAccess, Role } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { maskIp } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Painel do Agente de Conformidade (T19 · módulo 6).

  Lista os acessos ATÍPICOS detectados nas últimas 24h. Cada linha
  traz motivo, severidade e um CTA "Bloquear" — restrito a Admin.
  Bloqueio abre um dialog exigindo justificativa (mínimo 10 chars),
  que vira parte do evento gerado na trilha.

  Supervisor vê o painel como leitura pura (mesmo layout, sem CTA).
*/

const SEVERITY_STYLES: Record<
  AtypicalAccess["severity"],
  { border: string; badge: string; icon: string; iconClass: string }
> = {
  alta: {
    border: "border-[color:var(--c-danger)]/40",
    badge:
      "bg-[color-mix(in_srgb,var(--c-danger)_16%,var(--surface))] text-[color:var(--c-danger)] border-[color-mix(in_srgb,var(--c-danger)_35%,transparent)]",
    icon: "AlertOctagon",
    iconClass: "text-[color:var(--c-danger)]",
  },
  media: {
    border: "border-[color:var(--c-warning)]/45",
    badge:
      "bg-[color-mix(in_srgb,var(--c-warning)_16%,var(--surface))] text-[color:var(--c-warning)] border-[color-mix(in_srgb,var(--c-warning)_35%,transparent)]",
    icon: "AlertOctagon",
    iconClass: "text-[color:var(--c-warning)]",
  },
  baixa: {
    border: "border-n-300",
    badge: "bg-n-50 text-text-muted border-border",
    icon: "AlertOctagon",
    iconClass: "text-text-muted",
  },
};

const SEVERITY_LABEL: Record<AtypicalAccess["severity"], string> = {
  alta: "Alta severidade",
  media: "Média severidade",
  baixa: "Baixa severidade",
};

const ROLE_SHORT: Record<Role, string> = {
  auditor: "Auditor",
  supervisor: "Gestor",
  admin: "Admin",
  cidadao: "Cidadão",
  agente_sistema: "Sistema",
};

export function AgentPanel({
  accesses,
  canAct,
}: {
  accesses: readonly AtypicalAccess[];
  canAct: boolean;
}) {
  const active = accesses.filter((a) => !a.blocked);
  const blocked = accesses.filter((a) => a.blocked);

  return (
    <section
      aria-label="Painel do Agente de Conformidade"
      className="grid gap-3 rounded-[var(--r-lg)] border border-border bg-surface p-4 shadow-[var(--e-1)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-sm font-semibold text-text-strong">Agente de Conformidade</h2>
          <p className="text-xs text-muted-foreground">
            Acessos atípicos detectados nas últimas 24h. Bloqueio simulado registra evento na
            trilha.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-050 px-2 py-0.5 text-[11px] font-medium text-brand-deep">
          <ShieldAlertIcon aria-hidden="true" className="size-3" />
          {active.length} em aberto
        </span>
      </header>

      {active.length === 0 ? (
        <EmptyState
          icon={ShieldCheckIcon}
          title="Nenhum acesso atípico em aberto"
          description="O agente monitora continuamente. Qualquer novo desvio aparece aqui em tempo real."
        />
      ) : (
        <ul className="grid gap-2">
          {active.map((access) => (
            <li key={access.id}>
              <AtypicalRow access={access} canAct={canAct} />
            </li>
          ))}
        </ul>
      )}

      {blocked.length > 0 ? (
        <details className="rounded-[var(--r-md)] border border-dashed border-border bg-n-50/40 p-2 text-xs">
          <summary className="cursor-pointer font-medium text-text-muted">
            {blocked.length} acesso(s) bloqueado(s) recentemente
          </summary>
          <ul className="mt-2 grid gap-1.5">
            {blocked.map((access) => (
              <li
                key={access.id}
                className="flex flex-wrap items-center gap-2 rounded-sm bg-surface p-2"
              >
                <span className="font-data text-[11px] text-muted-foreground">{access.id}</span>
                <span className="text-[11px]">
                  {access.actorName} · {access.reason}
                </span>
                {access.blockedBy ? (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    bloqueado por {access.blockedBy}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function AtypicalRow({ access, canAct }: { access: AtypicalAccess; canAct: boolean }) {
  const styles = SEVERITY_STYLES[access.severity];
  const [open, setOpen] = useState(false);

  return (
    <article
      data-severity={access.severity}
      className={cn("grid gap-2 rounded-[var(--r-md)] border bg-surface p-3", styles.border)}
    >
      <header className="flex flex-wrap items-center gap-2">
        <AlertOctagonIcon aria-hidden="true" className={cn("size-4", styles.iconClass)} />
        <span className="text-[13px] font-semibold text-text-strong">{access.actorName}</span>
        <span className="text-[11px] text-muted-foreground">({ROLE_SHORT[access.actorRole]})</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
            styles.badge,
          )}
        >
          {SEVERITY_LABEL[access.severity]}
        </span>
      </header>

      <p className="text-[12px] leading-snug text-text-muted">{access.reason}</p>

      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <div className="flex gap-1">
          <dt className="font-medium text-text-muted">Recurso:</dt>
          <dd className="font-data">{access.resource}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-text-muted">IP:</dt>
          <dd className="font-data">{maskIp(access.ipAddress)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium text-text-muted">Detectado:</dt>
          <dd>{formatRelativeTime(access.detectedAt)}</dd>
        </div>
      </dl>

      {canAct ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            Bloquear
          </Button>
        </div>
      ) : (
        <p className="text-[11px] italic text-muted-foreground">
          Somente Administrador pode bloquear acessos.
        </p>
      )}

      {canAct ? <BlockAtypicalDialog access={access} open={open} onOpenChange={setOpen} /> : null}
    </article>
  );
}

function BlockAtypicalDialog({
  access,
  open,
  onOpenChange,
}: {
  access: AtypicalAccess;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const queryClient = useQueryClient();
  const [justificativa, setJustificativa] = useState("");

  const block = useMutation({
    mutationFn: (payload: string) =>
      apiRequest<AtypicalAccess>(`/compliance/atypical-accesses/${access.id}/block`, {
        method: "POST",
        body: { justificativa: payload },
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": user?.id ?? "mock-admin",
          "X-Actor-Name": user?.displayName ?? "Administrador",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "atypical-accesses"] });
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
      toast.success(`Acesso ${access.id} bloqueado. Evento registrado na trilha.`);
      setJustificativa("");
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao bloquear acesso.";
      toast.error(message);
    },
  });

  const trimmed = justificativa.trim();
  const valid = trimmed.length >= 10;

  return (
    <Dialog open={open} onOpenChange={(next) => (!block.isPending ? onOpenChange(next) : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bloquear acesso atípico</DialogTitle>
          <DialogDescription>
            Registre a justificativa. O evento entra na trilha imutável e o ator fica marcado como
            bloqueado no mock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="rounded-[var(--r-md)] border border-dashed border-border bg-n-50/40 p-3 text-[12px] text-text-muted">
            <p>
              <strong className="text-text-strong">{access.actorName}</strong> ·{" "}
              {ROLE_SHORT[access.actorRole]}
            </p>
            <p className="mt-1">{access.reason}</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="block-justificativa">Justificativa (mínimo 10 caracteres)</Label>
            <Textarea
              id="block-justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Descreva por que o bloqueio é necessário. Este texto será registrado na trilha."
              maxLength={280}
              aria-invalid={justificativa.length > 0 && !valid}
            />
            <p className="font-data text-[11px] text-muted-foreground">{trimmed.length}/280</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={block.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!valid || block.isPending}
            onClick={() => block.mutate(trimmed)}
          >
            {block.isPending ? "Bloqueando…" : "Confirmar bloqueio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
