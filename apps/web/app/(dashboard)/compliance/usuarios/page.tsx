"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  Loader2Icon,
  PlusIcon,
  ShieldAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { SystemUser } from "@fiscalcheck/shared-types";

import { SigiloBanner } from "@/components/compliance/sigilo-banner";
import { UserFormDialog } from "@/components/compliance/user-form-dialog";
import { UserList } from "@/components/compliance/user-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/lib/api-client";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { useSession } from "@/stores/session-store";

/*
  Página /compliance/usuarios (T19 · módulo 6, ADMIN ONLY).

  Cadastro operacional dos servidores autorizados. CRUD com step-up
  MFA em toda mutação (via `UserFormDialog` e `UserList`). Deletion
  não existe — apenas transição para status=inativo, preservando a
  cadeia de custódia (AGENTS.md §1.1).
*/

export default function ComplianceUsuariosPage() {
  const role = useSession((s) => s.role);
  const isAdmin = role === "admin";

  const usersQuery = useQuery({
    queryKey: ["compliance", "users"],
    queryFn: () => apiRequest<SystemUser[]>("/users"),
    enabled: isAdmin,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: SystemUser) => {
    setEditing(user);
    setFormOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="grid gap-5">
        <PageHeader
          title="Usuários e papéis"
          description="Cadastro operacional dos servidores autorizados na plataforma."
        />
        <ForbiddenNotice roleLabel={role ? ROLE_LABEL_PT[role] : "Perfil desconhecido"} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Usuários e papéis"
        description="CRUD de servidores com RBAC de menor privilégio. Toda mutação exige step-up MFA e registra evento na trilha. Módulo 6."
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline focus-visible:outline-none focus-visible:underline"
            >
              <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
              Visão geral
            </Link>
            <Button type="button" variant="default" onClick={openNew}>
              <PlusIcon aria-hidden="true" className="size-4" />
              Novo usuário
            </Button>
          </div>
        }
      />

      <SigiloBanner />

      {usersQuery.isLoading ? (
        <output
          aria-live="polite"
          className="flex items-center gap-2 rounded-[var(--r-md)] border border-dashed border-border bg-surface/60 p-6 text-sm text-muted-foreground"
        >
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
          Carregando cadastro de usuários…
        </output>
      ) : usersQuery.isError ? (
        <ErrorNotice onRetry={() => usersQuery.refetch()} />
      ) : (
        <UserList users={usersQuery.data ?? []} onEdit={openEdit} />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
        user={editing}
      />
    </div>
  );
}

function ForbiddenNotice({ roleLabel }: { roleLabel: string }) {
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title="Área restrita ao Administrador"
      description={`O perfil atual (${roleLabel}) não tem permissão para gerenciar usuários. Peça acesso ao Admin.`}
    />
  );
}

function ErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--r-md)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-5" />
        <div className="grid gap-1">
          <p className="font-semibold">Não foi possível carregar a lista de usuários.</p>
          <p className="text-xs">
            Verifique sua conexão com a API mock e tente novamente. Nenhum dado foi alterado.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
