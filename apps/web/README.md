# @fiscalcheck/web

Frontend Next.js 15 (App Router) do **FiscalCheck AI** — a UI dos auditores fiscais.

## Stack

- **Next.js 15** com App Router (Server Components por padrão)
- **TypeScript 5.7** com `strict: true`
- **Tailwind CSS v4** com tokens em CSS (`@theme` em `app/globals.css`)
- **shadcn/ui** (New York style, base color `neutral`)
- **TanStack Query v5** para fetch de dados do servidor
- **Zustand 5** para estado de UI local (sidebar) + sessão do auditor mock
- **React Hook Form + Zod v4** — validação de formulários
- **Sonner** — toaster global
- **@tanstack/react-table** — tabelas densas com ordenação/filtro
- **MSW** — camada de mock em service worker (ativa por `NEXT_PUBLIC_MSW_ENABLED`)
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

```text
app/                                    # rotas (App Router)
├── (auth)/login                        # split-screen com <LoginForm/> (T01)
├── (dashboard)/                        # área autenticada — <AppShell/> + guard
│   ├── dashboard                       # visão geral (KPIs + top casos) — T01
│   ├── ingestion                       # módulo 1 — timeline + monitor de cargas (T04)
│   ├── crossing                        # módulo 2
│   ├── ai                              # módulo 3 (scores + agentes)
│   ├── cases                           # módulo 4 — fila, dossiê, workflow (T13)
│   ├── citizen                         # portal do cidadão
│   ├── analytics                       # módulo 5
│   ├── comunicacoes                    # central de notificações eletrônicas (T15)
│   ├── esteira-de-agentes              # painel da esteira de agentes (T10)
│   ├── modelo-de-risco                 # config do modelo de risco (T02)
│   └── compliance                      # módulo 6 — visão geral + subrotas T19
│       ├── trilha                      # trilha de auditoria (admin only) — T19
│       └── usuarios                    # admin de servidores + step-up MFA — T19
├── (sandbox)/sandbox                   # catálogo do Design System
├── layout.tsx                          # RootLayout
├── page.tsx                            # redirect → /login
└── globals.css                         # Tailwind v4 + tokens DS
components/
├── app-shell/                          # sidebar, header, banner, sino de notificações
├── auth/                               # AuthLayout, InstitutionalPanel, LoginForm
├── agents/                             # cards e sheet da esteira de agentes (T10)
├── cases/                              # fila, dossiê e workflow de decisão (T13)
├── communications/                     # central de notificações (T15)
├── compliance/                         # trilha, agente de conformidade, admin (T19)
├── dashboard/                          # widgets do painel gerencial (T01)
├── risk-model/                         # editor + simulador do modelo de risco (T02)
├── providers.tsx                       # QueryClient + MSW bootstrap + Toaster
└── ui/                                 # shadcn primitives + componentes DS custom
lib/
├── api-client.ts                       # fetch client com correlation-id
├── case-transitions.ts                 # regras de estado dos casos (T13)
├── compliance/export-audit.ts          # export CSV/JSON da trilha (T19)
├── format-relative-time.ts             # "há 5 min" etc.
├── masks.ts                            # máscara de CPF/CNPJ/IP (T19)
├── mocks/agents.ts                     # fixtures dos agentes (T10)
├── risk-model/simulate.ts              # simulação do modelo (T02)
├── roles.ts                            # labels e helpers de papel
└── utils.ts                            # cn() helper
hooks/
└── use-agents-feed.ts                  # stream/pooling dos eventos da esteira (T10)
stores/
├── ui-store.ts                         # sidebar collapse
└── session-store.ts                    # papel + usuário mock (T01)
mocks/                                  # MSW: handlers + fixtures pseudonimizadas
tests/                                  # Vitest + Testing Library
```

## Aliases

| Alias                       | Aponta para                          |
| --------------------------- | ------------------------------------ |
| `@/*`                       | `apps/web/*`                         |
| `@fiscalcheck/shared-types` | `packages/shared-types/src/index.ts` |

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

## Camada de mock (MSW)

O frontend intercepta chamadas ao `NEXT_PUBLIC_API_URL` via MSW quando `NEXT_PUBLIC_MSW_ENABLED=true`. Todos os dados são sintéticos e pseudonimizados — CNPJs mascarados, sem qualquer referência a contribuinte real de Brusque/SC (AGENTS.md §1.2).

- Bootstrap idempotente em [`mocks/enable.ts`](./mocks/enable.ts); `<Providers/>` aguarda o worker antes de renderizar filhos.
- Handlers em [`mocks/handlers.ts`](./mocks/handlers.ts) — 1 endpoint por módulo (ingestão, cruzamento, IA, casos, cidadão, analytics, governança, notificações, auth mock). Todas as respostas são validadas contra os schemas Zod de [`@fiscalcheck/shared-types`](../../packages/shared-types) antes de sair.
- Fixtures em [`mocks/fixtures/`](./mocks/fixtures) — ajuste aqui para simular cenários.
- Regenerar o service worker (raro):

  ```powershell
  pnpm exec msw init public/
  ```

Para desligar o mock (ex.: testar contra o backend real): edite [`.env.local`](./.env.local) e defina `NEXT_PUBLIC_MSW_ENABLED=false`.

## Sessão mock (T01)

`stores/session-store.ts` guarda o papel (`Role`) do usuário logado em memória. O componente [`components/auth/login-form.tsx`](./components/auth/login-form.tsx) grava esse papel após o "login" e redireciona conforme:

- `auditor`, `supervisor`, `admin` → `/dashboard`
- `cidadao` → `/citizen`

O seletor de perfil fica oculto num popover ao lado do formulário (rótulo "Perfil"). Isso será substituído pelo NextAuth real na próxima leva (T03).

## Convenções

Veja [`../../AGENTS.md`](../../AGENTS.md) §4.1.
