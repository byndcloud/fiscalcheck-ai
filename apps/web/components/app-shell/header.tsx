"use client";

import { MenuIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

/*
  Header do shell autenticado. O slot central hospeda a busca global
  (T24) quando nenhuma página passa `breadcrumb` (nenhuma passa hoje).
  No grupo de ações: sino de notificações e o menu do avatar (T27) —
  identidade, preferências e sair. A busca só renderiza para perfis
  internos (RBAC interno ao componente); o Copilot Fiscal vive num FAB
  no canto inferior direito (ver AppShell). O botão de menu (mobile)
  fica a cargo do AppShell.
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

      {/*
        `truncate` (overflow-hidden) só quando o slot exibe breadcrumb: o
        dropdown da busca global é `absolute` dentro deste container e seria
        clipado — `min-w-0` mantém o flex contido sem cortar o dropdown.
      */}
      {breadcrumb ? (
        <div className="flex flex-1 items-center gap-2 truncate">{breadcrumb}</div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GlobalSearch />
        </div>
      )}

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Separator orientation="vertical" className="h-6" />
        <UserMenu />
      </div>
    </header>
  );
}
