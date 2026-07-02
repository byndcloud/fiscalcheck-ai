"use client";

import { Toaster as SonnerPrimitive, type ToasterProps } from "sonner";

/*
  FiscalCheck DS — Toaster (docs/design-system/design-system.md §7).
  Wrapper do `sonner` alinhado aos tokens do DS via CSS vars locais.
  Chamar `toast(...)` de `sonner` diretamente para disparar mensagens.
*/
function Toaster(props: ToasterProps) {
  return (
    <SonnerPrimitive
      theme="light"
      position="top-right"
      richColors
      closeButton
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--c-success)",
          "--success-border": "var(--c-success)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--c-danger)",
          "--error-border": "var(--c-danger)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-md shadow-[var(--e-2)]",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
