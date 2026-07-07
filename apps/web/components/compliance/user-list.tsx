"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, ShieldCheckIcon, ShieldOffIcon, UserXIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { SystemUser, SystemUserStatus } from "@fiscalcheck/shared-types";

import { RoleBadge } from "@/components/compliance/role-badge";
import { StepUpMfaDialog } from "@/components/compliance/step-up-mfa-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, apiRequest } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Lista de usuários (T19 · módulo 6).

  Tabela cadastral. "Desativar" NUNCA remove — só flipa status para
  `inativo`, preservando a cadeia de custódia (AGENTS.md §1.1). Cada
  ação de desativação também exige step-up MFA.
*/

const STATUS_STYLE: Record<SystemUserStatus, string> = {
  ativo:
    "bg-[color-mix(in_srgb,var(--c-risk-1)_14%,var(--surface))] text-[color:var(--c-risk-1)] border-[color-mix(in_srgb,var(--c-risk-1)_35%,transparent)]",
  suspenso:
    "bg-[color-mix(in_srgb,var(--c-warning)_16%,var(--surface))] text-[color:var(--c-warning)] border-[color-mix(in_srgb,var(--c-warning)_35%,transparent)]",
  inativo: "bg-n-50 text-text-muted border-border",
};

const STATUS_LABEL: Record<SystemUserStatus, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  inativo: "Inativo",
};

type Props = {
  users: readonly SystemUser[];
  onEdit: (user: SystemUser) => void;
};

export function UserList({ users, onEdit }: Props) {
  const [pending, setPending] = useState<SystemUser | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);

  const role = useSession((s) => s.role);
  const actorUser = useSession((s) => s.user);
  const queryClient = useQueryClient();

  const deactivate = useMutation({
    mutationFn: (user: SystemUser) =>
      apiRequest<SystemUser>(`/users/${user.id}/deactivate`, {
        method: "POST",
        headers: {
          "X-Actor-Role": role ?? "admin",
          "X-Actor-Id": actorUser?.id ?? "mock-admin",
          "X-Actor-Name": actorUser?.displayName ?? "Administrador",
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "users"] });
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
      toast.success(`Usuário ${data.nome} marcado como inativo.`);
      setPending(null);
      setMfaOpen(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao desativar usuário.";
      toast.error(message);
      setPending(null);
      setMfaOpen(false);
    },
  });

  if (users.length === 0) {
    return (
      <EmptyState
        title="Nenhum usuário cadastrado"
        description="Clique em Novo usuário para iniciar o cadastro."
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface shadow-[var(--e-1)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-n-50/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2.5">
                  Usuário
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Papel
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Status
                </th>
                <th scope="col" className="hidden px-3 py-2.5 md:table-cell">
                  MFA
                </th>
                <th scope="col" className="hidden px-3 py-2.5 lg:table-cell">
                  Último acesso
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/60 last:border-b-0 hover:bg-n-50/40"
                >
                  <td className="px-3 py-2.5 align-top">
                    <p className="text-[13px] font-semibold text-text-strong">{user.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{user.email}</p>
                    <p className="font-data text-[10px] text-muted-foreground">
                      matrícula {user.matricula}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLE[user.status],
                      )}
                    >
                      {STATUS_LABEL[user.status]}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 align-top md:table-cell">
                    {user.mfaHabilitado ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-[color:var(--c-risk-1)]">
                        <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                        <ShieldOffIcon aria-hidden="true" className="size-3.5" />
                        Desabilitado
                      </span>
                    )}
                  </td>
                  <td className="hidden px-3 py-2.5 align-top text-[12px] text-muted-foreground lg:table-cell">
                    {user.ultimoAcesso ? formatRelativeTime(user.ultimoAcesso) : "—"}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        aria-label={`Editar ${user.nome}`}
                      >
                        <PencilIcon aria-hidden="true" className="size-3.5" />
                        Editar
                      </Button>
                      {user.status !== "inativo" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPending(user);
                            setMfaOpen(true);
                          }}
                          disabled={deactivate.isPending}
                          aria-label={`Desativar ${user.nome}`}
                        >
                          <UserXIcon aria-hidden="true" className="size-3.5" />
                          Desativar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StepUpMfaDialog
        open={mfaOpen}
        onOpenChange={(next) => {
          setMfaOpen(next);
          if (!next) setPending(null);
        }}
        onConfirmed={() => pending && deactivate.mutate(pending)}
        isPending={deactivate.isPending}
        actionLabel={`desativar ${pending?.nome ?? "o usuário"}`}
      />
    </>
  );
}
