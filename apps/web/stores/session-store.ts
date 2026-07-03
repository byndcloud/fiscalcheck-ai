import { create } from "zustand";

import type { Role } from "@fiscalcheck/shared-types";

/**
 * Store de sessão do usuário (T01 — mock).
 *
 * MVP: sem persistência (recarregar a página zera a sessão). Isso é
 * intencional para o POC — evita que o mock "vaze" pra outros usuários
 * na mesma máquina e força passar pela tela de login em todo reload.
 *
 * Quando T03 introduzir NextAuth + JWT real, este store deverá ser
 * removido em favor de `useSession()` do next-auth (server-side sync).
 */

type MockUser = {
  id: string;
  displayName: string;
};

interface SessionState {
  role: Role | null;
  user: MockUser | null;
  setRole: (role: Role, user?: MockUser) => void;
  clear: () => void;
}

export const useSession = create<SessionState>((set) => ({
  role: null,
  user: null,
  setRole: (role, user) =>
    set({
      role,
      user: user ?? {
        id: `mock-${role}`,
        displayName: DEFAULT_DISPLAY_NAME[role],
      },
    }),
  clear: () => set({ role: null, user: null }),
}));

const DEFAULT_DISPLAY_NAME: Record<Role, string> = {
  auditor: "Auditor Fiscal",
  supervisor: "Gestor",
  admin: "Administrador",
  cidadao: "Contribuinte",
  agente_sistema: "Agente do sistema",
};
