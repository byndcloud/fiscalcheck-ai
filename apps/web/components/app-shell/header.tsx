"use client";

import { LogOutIcon, MenuIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { useSession } from "@/stores/session-store";

import { NotificationBell } from "./notification-bell";

/*
  Header do shell autenticado. Contém o slot de breadcrumb (à esquerda),
  identidade do usuário, sino de notificações e ação de logout.
  O botão de menu (mobile) fica a cargo do AppShell — recebido via prop.
*/

type HeaderProps = {
  breadcrumb?: React.ReactNode;
  onMenuClick?: () => void;
};

export function Header({ breadcrumb, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const user = useSession((s) => s.user);
  const clear = useSession((s) => s.clear);

  function handleLogout() {
    clear();
    router.push("/login");
  }

  return (
    <header
      data-slot="app-header"
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur"
    >
      {onMenuClick ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Abrir menu"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <MenuIcon aria-hidden="true" />
        </Button>
      ) : null}

      <div className="flex-1 truncate">{breadcrumb}</div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Separator orientation="vertical" className="h-6" />
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-text-strong leading-tight">
            {user?.displayName ?? "Sessão anônima"}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {role ? ROLE_LABEL_PT[role] : "Sem papel"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Encerrar sessão"
          onClick={handleLogout}
        >
          <LogOutIcon aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
