"use client";

import { useQuery } from "@tanstack/react-query";

import type { SearchResult } from "@fiscalcheck/shared-types";

import { apiRequest } from "@/lib/api-client";
import { useSession } from "@/stores/session-store";

/*
  Busca global (T24). O RBAC do endpoint (/search) é replicado via
  X-Actor-Role — apiRequest não injeta esse header automaticamente,
  mesmo padrão usado pela mutação de decisão em case-dossie-sheet.tsx.
*/
export function useGlobalSearch(query: string) {
  const role = useSession((s) => s.role);
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () =>
      apiRequest<SearchResult[]>(`/search?q=${encodeURIComponent(trimmed)}`, {
        headers: { "X-Actor-Role": role ?? "auditor" },
      }),
    enabled: trimmed.length > 1,
    staleTime: 10_000,
  });
}
