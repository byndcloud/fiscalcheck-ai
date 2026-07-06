"use client";

import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isAuditorRole } from "@/lib/roles";
import { useCopilotStore } from "@/stores/copilot-store";
import { useSession } from "@/stores/session-store";

/* Atalho fixo do Copilot Fiscal na topbar (T18). RBAC: perfis internos. */
export function CopilotButton() {
  const role = useSession((s) => s.role);
  const openCopilot = useCopilotStore((s) => s.openCopilot);

  if (!isAuditorRole(role)) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Abrir Copilot Fiscal"
      className="text-aurora hover:bg-[color-mix(in_srgb,var(--c-aurora)_12%,transparent)]"
      onClick={() => openCopilot()}
    >
      <SparklesIcon aria-hidden="true" />
    </Button>
  );
}
