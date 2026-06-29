# @fiscocheck/web

Frontend Next.js 15 (App Router) do **FiscoCheck AI** — a UI dos auditores fiscais.

## Stack

- **Next.js 15** com App Router (Server Components por padrão)
- **TypeScript 5.7** com `strict: true`
- **Tailwind CSS v4** com tokens em CSS (`@theme` em `app/globals.css`)
- **shadcn/ui** (New York style, base color `neutral`)
- **TanStack Query v5** para fetch de dados do servidor
- **Zustand 5** para estado de UI local
- **React Hook Form + Zod** para formulários
- **Biome** para lint/format
- **Vitest** + **Testing Library** para testes

## Scripts

```powershell
pnpm dev          # dev server (Turbopack) em :3000
pnpm build        # build de produção
pnpm start        # serve o build
pnpm lint         # biome check
pnpm lint:fix     # biome check --write
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run
```

## Estrutura

```
app/                  # rotas (App Router)
├── (auth)/login      # autenticação
├── (dashboard)/      # área autenticada
├── layout.tsx        # root layout
├── page.tsx          # landing
└── globals.css       # Tailwind v4 + tokens
components/           # componentes
├── providers.tsx     # QueryClientProvider
└── ui/               # componentes shadcn (instalados via CLI)
lib/
├── utils.ts          # cn() helper
└── api-client.ts     # fetch client com correlation-id
stores/               # Zustand
└── ui-store.ts       # estado de UI compartilhado
tests/                # Vitest
```

## Aliases

| Alias | Aponta para |
|---|---|
| `@/*` | `apps/web/*` |
| `@fiscocheck/shared-types` | `packages/shared-types/src/index.ts` |

## Como adicionar componentes shadcn/ui

```powershell
pnpm dlx shadcn@latest add button input dialog
```

Os componentes serão instalados em `components/ui/`.

## Tailwind v4

A configuração vive em **CSS** (`app/globals.css`), não em `tailwind.config.js`:

```css
@theme inline {
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
}
```

Quando o design system entrar em `docs/design-system/`, os tokens (cores, tipografia, raio) vão substituir os placeholders neste arquivo.

## Convenções

Veja [`../../AGENTS.md`](../../AGENTS.md) §4.1.
