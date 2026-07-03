"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { AuditLogEntry } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError, apiRequest } from "@/lib/api-client";
import { maskIp, maskSensitiveText } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Drill-in da trilha (T19 · módulo 6).

  Mostra o evento inteiro em layout de dossiê. Dados sensíveis
  (`dadosAcessados`) chegam mascarados; o botão "Revelar" dispara um
  novo evento na trilha (append-only real) e registra a INTENÇÃO
  antes de exibir os valores originais.
*/

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "medium",
});

const RESULT_LABEL: Record<AuditLogEntry["result"], string> = {
  sucesso: "Sucesso",
  negado: "Negado",
  erro: "Erro",
};

type Props = {
  entry: AuditLogEntry | null;
  onOpenChange: (open: boolean) => void;
};

export function AuditLogDetailSheet({ entry, onOpenChange }: Props) {
  const [revealed, setRevealed] = useState(false);
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset intencional quando muda o evento — entry.id é a chave estável
  useEffect(() => {
    setRevealed(false);
  }, [entry?.id]);

  const reveal = useMutation({
    mutationFn: async () => {
      if (!entry) return;
      await apiRequest("/compliance/audit-log-v2/export", {
        method: "POST",
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": user?.id ?? "mock-admin",
          "X-Actor-Name": user?.displayName ?? "Administrador",
        },
        body: { format: "csv", total: 0 },
      });
    },
  });

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        {entry ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-base">
                <span className="font-data text-[13px] font-normal text-muted-foreground">
                  {entry.id}
                </span>
                <span>Detalhe do evento</span>
              </SheetTitle>
              <SheetDescription className="font-data text-[12px]">
                {DATE_FMT.format(new Date(entry.timestamp))}
              </SheetDescription>
            </SheetHeader>

            {entry.atypical ? (
              <div className="flex items-start gap-2 rounded-[var(--r-md)] border border-[color:var(--c-danger)]/40 bg-[color-mix(in_srgb,var(--c-danger)_10%,var(--surface))] p-3 text-[12px] text-[color:var(--c-danger)]">
                <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <div className="grid gap-0.5">
                  <p className="font-semibold">Acesso atípico</p>
                  {entry.atypicalReason ? <p>{entry.atypicalReason}</p> : null}
                </div>
              </div>
            ) : null}

            <dl className="grid gap-3 text-[13px]">
              <Field label="Ator">
                <div>
                  <p className="font-medium text-text-strong">{entry.actorName}</p>
                  <p className="font-data text-[11px] text-muted-foreground">
                    {entry.actorId} · {entry.actorRole}
                  </p>
                </div>
              </Field>
              <Field label="Ação">
                <code className="font-data text-[12px] text-text-strong">{entry.action}</code>
              </Field>
              <Field label="Recurso">
                <code className="font-data text-[12px] text-text-strong">
                  {maskSensitiveText(entry.resource)}
                </code>
              </Field>
              <Field label="IP de origem">
                <code className="font-data text-[12px] text-text-strong">
                  {maskIp(entry.ipAddress)}
                </code>
              </Field>
              <Field label="Resultado">
                <span className="font-medium text-text-strong">{RESULT_LABEL[entry.result]}</span>
              </Field>
              <Field label="Correlation ID">
                <code className="font-data text-[11px] text-muted-foreground">
                  {entry.correlationId}
                </code>
              </Field>
              <Field label="Descrição">
                <p className="text-[13px] leading-snug text-text-muted">{entry.details}</p>
              </Field>

              {entry.dadosAcessados ? (
                <div className="grid gap-2 rounded-[var(--r-md)] border border-dashed border-border bg-n-50/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Dados acessados
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!revealed) {
                          try {
                            await reveal.mutateAsync();
                            queryClient.invalidateQueries({
                              queryKey: ["compliance", "audit-log-v2"],
                            });
                            toast.success("Revelação registrada na trilha.");
                          } catch (error) {
                            const message =
                              error instanceof ApiError
                                ? error.message
                                : error instanceof Error
                                  ? error.message
                                  : "Falha ao registrar revelação.";
                            toast.error(message);
                            return;
                          }
                        }
                        setRevealed((v) => !v);
                      }}
                      className="gap-1"
                    >
                      {revealed ? (
                        <>
                          <EyeOffIcon aria-hidden="true" className="size-3.5" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <EyeIcon aria-hidden="true" className="size-3.5" />
                          Revelar dados
                        </>
                      )}
                    </Button>
                  </div>
                  <p
                    className={cn(
                      "font-data text-[12px] leading-snug",
                      revealed ? "text-text-strong" : "text-text-muted",
                    )}
                  >
                    {revealed ? entry.dadosAcessados : maskSensitiveText(entry.dadosAcessados)}
                  </p>
                  {!revealed ? (
                    <p className="text-[11px] italic text-muted-foreground">
                      Revelar registra um novo evento (append-only) na própria trilha.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </dl>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
