"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { selectUnreadCount, useNotificationsStore } from "@/stores/notifications-store";

/**
 * Sino de notificações (T01 — versão mínima). T10 exige que erro de agente
 * gere um alerta aqui; ver docs em stores/notifications-store.ts.
 */
export function NotificationBell() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) markAllAsRead();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Notificações — ${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
              : "Notificações"
          }
          className="relative"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      {/*
        bg-popover/z-index/overflow-hidden explícitos: o painel só herdava esses
        valores do componente Popover base, o que deixava o card poroso a
        conteúdo da página abaixo (cantos quadrados do header vazando pelo
        rounded-md, sem clipe).

        A lista usa altura FIXA (h-, não max-h/flex-1): o Root do Radix
        ScrollArea só calcula overflow/scroll se receber uma altura resolvida
        de forma independente do layout do pai. Um max-height num container
        flex com altura "auto" não força esse cálculo de forma confiável — o
        ScrollArea acaba crescendo para caber todo o conteúdo e quem corta o
        excesso é o overflow-hidden do PopoverContent, sem gerar scroll
        nenhum. max-h no PopoverContent fica só como cinto de segurança para
        o cabeçalho não estourar em telas muito baixas.
      */}
      <PopoverContent
        align="end"
        className="z-[100] w-80 max-h-[min(28rem,80vh)] overflow-hidden border bg-popover p-0 shadow-[var(--e-3)]"
      >
        <div className="border-b bg-popover px-4 py-3">
          <p className="text-sm font-semibold text-text-strong">Notificações</p>
          <p className="text-xs text-muted-foreground">Alertas da esteira de agentes</p>
        </div>
        <ScrollArea className="h-[min(24rem,60vh)] bg-popover">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação por enquanto.
            </p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b px-4 py-3 last:border-0">
                  <p className="text-sm text-text-strong">{notification.mensagem}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {notification.agentId} · {notification.agentNome} ·{" "}
                    {formatRelativeTime(notification.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
