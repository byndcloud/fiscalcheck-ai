import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

/*
  FiscalCheck Design System v2.0 §4 — dois papéis tipográficos.

  Raleway (UI): face canônica de títulos, corpo, labels e botões.
  Montserrat (display numérico + dados): KPIs (25/700), medidor de score
    (48/800), valor hero (35/800), valor secundário (19–22/700), métricas
    de rede E TAMBÉM os dados tabulares miúdos e identificadores (IDs de
    caso, CNPJ, competências, protocolos, contadores, valores em linhas de
    tabela) — antes em Roboto Mono, agora unificados na Montserrat. Por
    isso os pesos leves (400/500) também são carregados.

  A Rawline (auto-hospedada em apps/web/app/fonts/, OFL 1.1) permanece
  como equivalente institucional aceito em contextos gov.br, mas deixa
  de ser carregada por padrão pelo next/font — hoje entra apenas como
  fallback declarativo em --font-ui (ver globals.css).
*/
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-raleway",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FiscalCheck AI",
    template: "%s · FiscalCheck AI",
  },
  description:
    "Plataforma de Inteligência Fiscal Agêntica — Secretaria Municipal da Fazenda de Brusque/SC",
  applicationName: "FiscalCheck AI",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "FiscalCheck AI",
    description: "Inteligência fiscal agêntica — Secretaria da Fazenda · Brusque/SC",
    siteName: "FiscalCheck AI",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/brand/logo-horizontal.png",
        width: 1024,
        height: 683,
        alt: "FiscalCheck AI — Inteligência fiscal agêntica",
      },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${raleway.variable} ${montserrat.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
