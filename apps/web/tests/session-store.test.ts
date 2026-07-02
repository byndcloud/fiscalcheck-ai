import { beforeEach, describe, expect, it } from "vitest";

import { useSession } from "@/stores/session-store";

describe("useSession store", () => {
  beforeEach(() => {
    useSession.getState().clear();
  });

  it("começa sem papel definido", () => {
    expect(useSession.getState().role).toBeNull();
    expect(useSession.getState().user).toBeNull();
  });

  it("setRole grava papel e cria usuário mock coerente", () => {
    useSession.getState().setRole("auditor");
    const state = useSession.getState();
    expect(state.role).toBe("auditor");
    expect(state.user?.id).toBe("mock-auditor");
    expect(state.user?.displayName).toMatch(/auditor/i);
  });

  it("setRole aceita usuário customizado", () => {
    useSession.getState().setRole("supervisor", {
      id: "user-123",
      displayName: "Ana Supervisora",
    });
    expect(useSession.getState().user?.id).toBe("user-123");
    expect(useSession.getState().user?.displayName).toBe("Ana Supervisora");
  });

  it("clear zera papel e usuário", () => {
    useSession.getState().setRole("admin");
    useSession.getState().clear();
    expect(useSession.getState().role).toBeNull();
    expect(useSession.getState().user).toBeNull();
  });
});
