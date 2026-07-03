import { beforeEach, describe, expect, it } from "vitest";

import { selectUnreadCount, useNotificationsStore } from "@/stores/notifications-store";

describe("notifications-store (sino / T01)", () => {
  beforeEach(() => {
    useNotificationsStore.setState({ notifications: [] });
  });

  it("começa vazio, sem notificações não lidas", () => {
    expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    expect(selectUnreadCount(useNotificationsStore.getState())).toBe(0);
  });

  it("addNotification insere no topo como não lida", () => {
    useNotificationsStore.getState().addNotification({
      agentId: "FA05",
      agentNome: "Agente de Score de Risco",
      mensagem: "Falha ao processar lote.",
      timestamp: new Date().toISOString(),
    });

    const { notifications } = useNotificationsStore.getState();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ agentId: "FA05", lida: false });
    expect(selectUnreadCount(useNotificationsStore.getState())).toBe(1);
  });

  it("markAllAsRead zera a contagem de não lidas sem remover o histórico", () => {
    useNotificationsStore.getState().addNotification({
      agentId: "FA05",
      agentNome: "Agente X",
      mensagem: "erro 1",
      timestamp: "2026-01-01T00:00:00Z",
    });
    useNotificationsStore.getState().addNotification({
      agentId: "FA06",
      agentNome: "Agente Y",
      mensagem: "erro 2",
      timestamp: "2026-01-01T00:01:00Z",
    });

    useNotificationsStore.getState().markAllAsRead();

    const { notifications } = useNotificationsStore.getState();
    expect(notifications).toHaveLength(2);
    expect(notifications.every((n) => n.lida)).toBe(true);
    expect(selectUnreadCount(useNotificationsStore.getState())).toBe(0);
  });

  it("mantém no máximo 20 notificações (mais recentes primeiro)", () => {
    for (let i = 0; i < 25; i += 1) {
      useNotificationsStore.getState().addNotification({
        agentId: "FA01",
        agentNome: "Agente 24/7 de Ingestão",
        mensagem: `evento ${i}`,
        timestamp: new Date().toISOString(),
      });
    }

    const { notifications } = useNotificationsStore.getState();
    expect(notifications).toHaveLength(20);
    expect(notifications[0]?.mensagem).toBe("evento 24");
  });
});
