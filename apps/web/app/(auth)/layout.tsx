import type * as React from "react";

/*
  Layout do grupo `(auth)`. Fica intencionalmente enxuto — o
  <AuthLayout/> cuida do split-screen dentro de cada página do grupo.
*/
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
