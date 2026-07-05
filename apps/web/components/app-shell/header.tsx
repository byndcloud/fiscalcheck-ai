"use client";

import { MenuIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

/*
  Header do shell autenticado. Contém o slot de breadcrumb (à esquerda),
  sino de notificações e o menu do avatar (T27) — que concentra a
  identidade do usuário, preferências e a ação de sair.
  O botão de menu (mobile) fica a cargo do AppShell — recebido via prop.
*/

type HeaderProps = {
  breadcrumb?: React.ReactNode;
  onMenuClick?: () => void;
};

export function Header({ breadcrumb, onMenuClick }: HeaderProps) {
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
        <UserMenu />
      </div>
    </header>
  );
}
