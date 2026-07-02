import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Montserrat, Raleway, Roboto_Mono } from "next/font/google";
import "./globals.css";

/*
  FiscalCheck Design System v2.0 §4 — três papéis tipográficos.

  Raleway (UI): face canônica de títulos, corpo, labels e botões.
  Montserrat (display numérico): KPIs (25/700), medidor de score (48/800),
    valor hero (35/800), valor secundário (19–22/700), métricas de rede.
  Roboto Mono (dados tabulares miúdos e identificadores): IDs de caso,
    CNPJ, competências, protocolos, contadores, valores em linhas de tabela,
    extremos da escala do medidor.

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
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-mono",
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${raleway.variable} ${montserrat.variable} ${robotoMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
