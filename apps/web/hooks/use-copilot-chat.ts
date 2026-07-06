"use client";

import { useMutation } from "@tanstack/react-query";

import type { CopilotAskRequest, CopilotAskResponse } from "@fiscalcheck/shared-types";

import { apiRequest } from "@/lib/api-client";
import { useSession } from "@/stores/session-store";

/* Copilot Fiscal (T18) — pergunta pontual, sem persistir histórico no backend. */
export function useCopilotChat() {
  const role = useSession((s) => s.role);

  return useMutation({
    mutationFn: (input: CopilotAskRequest) =>
      apiRequest<CopilotAskResponse>("/copilot/ask", {
        method: "POST",
        body: input,
        headers: { "X-Actor-Role": role ?? "auditor" },
      }),
  });
}
