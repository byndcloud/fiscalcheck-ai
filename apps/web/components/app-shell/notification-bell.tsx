"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, BellIcon, BellRingIcon, CheckIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { Notificacao } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SkeletonText } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/use-user-profile";
import { apiRequest } from "@/lib/api-client";
import { resolveErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/*
  Sino de notificações. Consulta GET /notifications via TanStack Query,
  marca como lida via POST /notifications/:id/read com optimistic update.
  Estado "lido" é apenas em memória (plano T01) — sem localStorage.
*/

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

async function fetchNotifications(): Promise<Notificacao[]> {
  return apiRequest<Notificacao[]>("/notifications");
}

async function markNotificationRead(id: string): Promise<Notificacao> {
  return apiRequest<Notificacao>(`/notifications/${id}/read`, { method: "POST" });
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RELATIVE_TIME.format(diffSec, "second");
  if (abs < 3600) return RELATIVE_TIME.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RELATIVE_TIME.format(Math.round(diffSec / 3600), "hour");
  return RELATIVE_TIME.format(Math.round(diffSec / 86400), "day");
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    staleTime: 30_000,
    // T25: erro do sino é resolvido inline (retry no próprio popover).
    // Evita toast global — o sino está sempre visível, um toast a mais
    // seria ruído em cima de um problema que o usuário já vê.
    meta: { silent: true },
  });

  const mutation = useMutation({
    mutationFn: markNotificationRead,
    // T25: erros de "marcar como lida" caem no toast global.
    // Nada específico a comunicar aqui além da mensagem amigável pt-BR.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Notificacao[]>(NOTIFICATIONS_QUERY_KEY);
      queryClient.setQueryData<Notificacao[]>(
        NOTIFICATIONS_QUERY_KEY,
        (current) =>
          current?.map((n) =>
            n.id === id ? { ...n, lida: true, lidaEm: new Date().toISOString() } : n,
          ) ?? current,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  /*
    T27: preferência "Notificações no sino" desligada silencia o alerta
    visual (badge/ícone tocando), mas a lista continua acessível — o
    usuário escolhe não ser interrompido, não perder o histórico.
  */
  const profileQuery = useUserProfile();
  const alertsEnabled = profileQuery.data?.preferencias.notificacoesAtivas ?? true;

  const unreadCount = useMemo(() => query.data?.filter((n) => !n.lida).length ?? 0, [query.data]);

  const IconComp = alertsEnabled && unreadCount > 0 ? BellRingIcon : BellIcon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            alertsEnabled && unreadCount > 0
              ? `Notificações — ${unreadCount} não lidas`
              : "Notificações"
          }
          className="relative"
        >
          <IconComp className="size-4" aria-hidden="true" />
          {alertsEnabled && unreadCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-96 p-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-text-strong">Notificações</p>
            <p className="text-xs text-muted-foreground">
              {!alertsEnabled
                ? "Alertas silenciados nas preferências"
                : unreadCount === 0
                  ? "Tudo em dia"
                  : `${unreadCount} não lida${unreadCount === 1 ? "" : "s"}`}
            </p>
          </div>
        </header>
        <div className="max-h-80 overflow-y-auto">
          {query.isPending ? (
            <div className="px-4 py-4">
              <SkeletonText lines={3} />
            </div>
          ) : query.isError ? (
            <div role="alert" className="grid gap-2 px-4 py-6 text-center text-sm text-destructive">
              <p className="font-medium">{resolveErrorMessage(query.error).title}</p>
              <p className="text-xs text-muted-foreground">
                {resolveErrorMessage(query.error).description}
              </p>
              <div className="mt-1 flex justify-center">
                <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()}>
                  <RefreshCwIcon aria-hidden="true" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (query.data?.length ?? 0) === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Sem notificações.</p>
          ) : (
            <ul className="divide-y divide-border">
              {query.data?.map((notification) => (
                <li key={notification.id}>
                  <article
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      !notification.lida && "bg-brand-050/60",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        notification.severidade >= 4
                          ? "bg-[color:var(--c-risk-5)]"
                          : notification.severidade === 3
                            ? "bg-[color:var(--c-risk-3)]"
                            : "bg-brand",
                      )}
                    />
                    <div className="grid flex-1 gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-text-strong leading-tight">
                          {notification.titulo}
                        </p>
                        <time
                          dateTime={notification.criadoEm}
                          className="whitespace-nowrap text-[11px] text-muted-foreground"
                        >
                          {formatRelative(notification.criadoEm)}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {notification.corpo}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {!notification.lida ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => mutation.mutate(notification.id)}
                            disabled={mutation.isPending}
                          >
                            <CheckIcon aria-hidden="true" />
                            Marcar como lida
                          </Button>
                        ) : null}
                        {/* T14: deep-link — devolutiva no sino abre o dossiê do caso */}
                        {notification.linkHref ? (
                          <Button asChild variant="ghost" size="xs">
                            <Link
                              href={notification.linkHref as never}
                              onClick={() => {
                                if (!notification.lida) mutation.mutate(notification.id);
                                setOpen(false);
                              }}
                            >
                              {notification.casoId ? "Abrir caso" : "Abrir"}
                              <ArrowRightIcon aria-hidden="true" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
