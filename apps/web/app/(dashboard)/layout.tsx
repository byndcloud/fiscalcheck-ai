"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type * as React from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { useSession } from "@/stores/session-store";

/*
  Guard client-side (MVP mock). Se não houver `role`, volta ao /login.
  Segrega perfis:
   - `cidadao` só pode ver /citizen → qualquer outra rota redireciona.
   - Perfis auditoriais (auditor/supervisor/admin) NÃO acessam /citizen
     — se caírem lá manualmente, voltam para /dashboard. Isso é
     defense-in-depth: o sidebar já esconde o item, mas o guard reforça.
  T03 substituirá pelo middleware NextAuth real.
*/
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((s) => s.role);

  useEffect(() => {
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role === "cidadao" && pathname !== "/citizen") {
      router.replace("/citizen");
      return;
    }
    if (role !== "cidadao" && pathname === "/citizen") {
      router.replace("/dashboard");
    }
  }, [role, pathname, router]);

  if (!role) {
    return (
      <output
        aria-live="polite"
        className="grid min-h-svh place-items-center text-sm text-muted-foreground"
      >
        Redirecionando para o login…
      </output>
    );
  }

  return <AppShell>{children}</AppShell>;
}
