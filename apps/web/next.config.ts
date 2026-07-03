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
