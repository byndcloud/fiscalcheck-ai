"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CitizenRegistration,
  CitizenRegistrationUpdateRequest,
  Role,
  UserPreferences,
  UserProfile,
} from "@fiscalcheck/shared-types";

import { apiRequest } from "@/lib/api-client";
import { notify } from "@/lib/toast";
import { useSession } from "@/stores/session-store";

/*
  Perfil e preferências do usuário logado (T27 · Transversal).

  - `useUserProfile` — GET /me?role=… (perfil + preferências persistidas
    na camada de serviço fake). Cache por papel: trocar de perfil na
    demo não vaza preferências entre identidades.
  - `useUpdatePreferences` — PUT /me/preferences com merge parcial.
    Erro cai no tratamento global do QueryClient (T25).
  - `useUpdateRegistration` — PUT /me/registration (contato/endereço
    do cidadão, editáveis pelo próprio no portal).
*/

export function meQueryKey(role: Role | null): readonly [string, Role | null] {
  return ["me", role] as const;
}

async function fetchProfile(role: Role): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/me?role=${encodeURIComponent(role)}`);
}

export function useUserProfile() {
  const role = useSession((s) => s.role);
  return useQuery({
    queryKey: meQueryKey(role),
    queryFn: () => fetchProfile(role as Role),
    enabled: role !== null,
    staleTime: 60_000,
  });
}

export function useUpdatePreferences() {
  const role = useSession((s) => s.role);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferencias: Partial<UserPreferences>) =>
      apiRequest<UserPreferences>("/me/preferences", {
        method: "PUT",
        body: { role, preferencias },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(meQueryKey(role), (current) =>
        current ? { ...current, preferencias: updated } : current,
      );
      notify.success("Preferências salvas.");
    },
  });
}

export function useUpdateRegistration() {
  const role = useSession((s) => s.role);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: CitizenRegistrationUpdateRequest) =>
      apiRequest<CitizenRegistration>("/me/registration", {
        method: "PUT",
        body: updates,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<UserProfile>(meQueryKey(role), (current) =>
        current ? { ...current, dadosCadastrais: updated } : current,
      );
      notify.success("Dados atualizados.", {
        description: "Suas informações de contato e endereço foram salvas.",
      });
    },
  });
}
