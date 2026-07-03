import { create } from "zustand";

/**
 * Store global de notificações do sino (T01).
 *
 * Infraestrutura mínima: T10 precisa que erro de agente dispare um alerta
 * aqui; o T01 completo (persistência, categorias, outros produtores) deve
 * estender este store em vez de criar um paralelo.
 */
export interface AgentNotification {
  id: string;
  agentId: string;
  agentNome: string;
  mensagem: string;
  timestamp: string;
  lida: boolean;
}

const MAX_NOTIFICATIONS = 20;

interface NotificationsState {
  notifications: AgentNotification[];
  addNotification: (input: Omit<AgentNotification, "id" | "lida">) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (input) =>
    set((state) => ({
      notifications: [
        { id: crypto.randomUUID(), lida: false, ...input },
        ...state.notifications,
      ].slice(0, MAX_NOTIFICATIONS),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({ ...notification, lida: true })),
    })),
}));

export function selectUnreadCount(state: NotificationsState): number {
  return state.notifications.filter((notification) => !notification.lida).length;
}
