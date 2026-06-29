import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FiscoCheck AI",
    template: "%s · FiscoCheck AI",
  },
  description:
    "Plataforma de Inteligência Fiscal Agêntica — Secretaria Municipal da Fazenda de Brusque/SC",
  applicationName: "FiscoCheck AI",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
