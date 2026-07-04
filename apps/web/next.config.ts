import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Origens permitidas para requisições de dev (HMR/assets) vindas do proxy
// de preview do Replit, que serve o app dentro de um iframe em outro host.
const replitDevOrigins = [
  process.env.REPLIT_DEV_DOMAIN,
  "*.replit.dev",
  "*.repl.co",
  "*.worf.replit.dev",
].filter(Boolean) as string[];

// Cabeçalhos de segurança mantidos em produção. Em desenvolvimento o
// X-Frame-Options: DENY é omitido porque impede o app de carregar dentro
// do iframe da preview do Replit (sintoma: preview em branco / bloqueada).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

if (!isDev) {
  securityHeaders.push({ key: "X-Frame-Options", value: "DENY" });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  allowedDevOrigins: replitDevOrigins,
  /*
    Libs Node-first isoladas em SSR (o Next não tenta pré-empacotar):

    · `@react-pdf/renderer` (T28 dossiê e T17 relatórios) — usa
      `fs`, `zlib`, `stream` etc. No cliente, o import é dinâmico
      dentro de `lib/dossie/export-dossie.tsx` e `lib/reports/
      generate-report.tsx`, então a lib só carrega quando o
      auditor/gestor aciona a exportação.
    · `xlsx` (T17 relatórios gerenciais) — SheetJS Community usa
      APIs Node internamente; importada dinamicamente em
      `lib/reports/build-xlsx.ts`. Isolar em SSR evita que o
      Turbopack tente empacotá-la no bundle server.
  */
  serverExternalPackages: ["@react-pdf/renderer", "xlsx"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
