import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/*
  Rawline — fonte UI institucional do FiscoCheck DS (docs/design-system/design-system.md §4).
  Auto-hospedada a partir de apps/web/app/fonts/ (arquivos baixados do CDN gov.br
  sob SIL Open Font License 1.1 — ver apps/web/app/fonts/LICENSE.txt).

  Pesos:
    400 corpo, 600 label/dados secundários, 700 títulos de bloco, 800 display/H1.

  Auto-hospedagem elimina dependência de CDN externo (resiliência + privacidade
  do auditor — não vaza IP para terceiros só para carregar fonte).
*/
const rawline = localFont({
	src: [
		{ path: "./fonts/rawline-400.woff2", weight: "400", style: "normal" },
		{ path: "./fonts/rawline-600.woff2", weight: "600", style: "normal" },
		{ path: "./fonts/rawline-700.woff2", weight: "700", style: "normal" },
		{ path: "./fonts/rawline-800.woff2", weight: "800", style: "normal" },
	],
	variable: "--font-rawline",
	display: "swap",
	fallback: ["Raleway", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

/*
  Roboto Mono — fonte de dados (KPIs, scores, valores monetários).
  Spec: docs/design-system/design-system.md §4. A variável CSS
  `--font-roboto-mono` é consumida por `--font-data` em globals.css.
*/
const robotoMono = Roboto_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-roboto-mono",
	display: "swap",
});

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
		<html
			lang="pt-BR"
			suppressHydrationWarning
			className={`${rawline.variable} ${robotoMono.variable}`}
		>
			<body className="min-h-screen bg-background font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
