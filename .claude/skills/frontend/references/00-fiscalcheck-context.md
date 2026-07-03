# 00 — Contexto FiscalCheck AI (leitura obrigatória)

> **Esta é a referência oficial da skill `frontend` deste projeto.** Consulte-a antes de qualquer recomendação genérica que o agente traga da própria base — as regras deste arquivo têm precedência. As demais references da skill (genéricas, do template Cursor) foram removidas na simplificação MVP; se voltarem, siga a mesma hierarquia.

---

## 1. Stack fixa do `apps/web`

Não há decisão de stack a tomar. **Não introduza** alternativas sem ADR.

| Camada | Decisão |
|---|---|
| Framework | **Next.js 15** (App Router; Pages Router proibido) |
| Linguagem | **TypeScript** estrito (`strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess`) — sem `any` em código novo |
| Estilos | **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme inline`, sem `tailwind.config.js`) + **tw-animate-css** |
| Componentes | **shadcn/ui** (`style: "new-york"`, prefix vazio) em `components/ui/`; instalação via `pnpm dlx shadcn@latest add <componente>` |
| Estado servidor | **TanStack Query v5** (cliente em [`apps/web/components/providers.tsx`](../../../../apps/web/components/providers.tsx)) — sem `useEffect` para fetch |
| Estado UI | **Zustand** — só para sidebars, modais, filtros globais (ver [`apps/web/stores/ui-store.ts`](../../../../apps/web/stores/ui-store.ts)) |
| Forms | **react-hook-form** + **zod** + **@hookform/resolvers** |
| Ícones | **lucide-react** |
| Cliente HTTP | [`apps/web/lib/api-client.ts`](../../../../apps/web/lib/api-client.ts) — propaga `X-Correlation-Id` em toda chamada |
| Tipos do backend | `@fiscalcheck/shared-types` — **tipos manuais no MVP** (`src/index.ts` + `schemas/*.ts` Zod); geração via OpenAPI volta quando o backend expuser as rotas reais (ver [`AGENTS.md` §4.1](../../../../AGENTS.md)) |
| Lint/format | **Biome** (config em [`packages/biome-config/biome.json`](../../../../packages/biome-config/biome.json)) — `indentStyle: space, indentWidth: 2` |
| Testes | **Vitest** + **@testing-library/react** + **jsdom** ([`vitest.config.ts`](../../../../apps/web/vitest.config.ts)) |

Path alias: `@/*` aponta para `apps/web/`. Use `import { ... } from "@/components/..."`, nunca caminhos relativos longos.

## 2. Identidade visual — FiscalCheck Design System v2.0

A spec completa está em [`docs/design-system/design-system.md`](../../../../docs/design-system/design-system.md). Os tokens vivem em [`apps/web/app/globals.css`](../../../../apps/web/app/globals.css) (`:root` e `.dark`) e estão expostos como utilitários Tailwind via `@theme inline`.

### 2.1 Tipografia — regra dura do projeto

Recomendações genéricas (do template da skill ou de outras fontes) sobre "usar Inter/Roboto/Arial como escolha primária" **não valem aqui**. O DS v2.0 fixa três famílias:

- **Raleway** (Google Fonts, 400–800) é a face canônica de UI — títulos, corpo, labels e botões. Utility Tailwind: `font-sans`.
- **Montserrat** (Google Fonts, 600–800) é a face de *display numérico* — KPIs (25/700), score do medidor (48/800), valor hero (35/800), valor secundário (19–22/700), métricas de rede. Utility Tailwind: `font-display`.
- **Roboto Mono** (Google Fonts, 400–700) fica restrita a identificadores e dados tabulares miúdos — IDs de caso, CNPJ, competências, protocolos, contadores, valores em linhas de tabela, extremos da escala do medidor. Utility Tailwind: `font-data`/`font-mono`.
- A **Rawline** permanece como equivalente institucional aceito para contextos gov.br (arquivos em [`apps/web/app/fonts/`](../../../../apps/web/app/fonts/), OFL 1.1) — entra apenas como fallback declarativo em `--font-ui`, não substitui Raleway na produção.

Não troque essas famílias. Não importe outras.

### 2.2 Camadas semânticas de cor (regra dura)

- **Marca institucional** (`bg-primary`, `text-brand`, `bg-brand-050`, …) — ações de efeito jurídico (intimação, abrir fiscalização). Botões de decisão usam `variant="default"`.
- **Camada Aurora** (`bg-[image:var(--grad-aurora)]`, `text-aurora`, …) — **exclusiva** de saídas de IA: Copilot, esteira de agentes, monitoramento contínuo, indicadores ao vivo. Botão `variant="aurora"` carrega o gradiente. Nunca use Aurora para ações fiscais — viola o princípio human-in-the-loop ([`AGENTS.md` §1.1](../../../../AGENTS.md)).
- **Espectro de risco** (`bg-risk-1` verde → `bg-risk-5` vermelho) — exclusivo para representar o score de risco do contribuinte (RF03 do edital). Não use para outros gradientes.
- **Semânticas** (`bg-success`, `bg-warning`, `bg-info`, `bg-destructive`) — feedback de operação.

### 2.3 Movimento

`prefers-reduced-motion: reduce` já está aplicado globalmente em `apps/web/app/globals.css` `@layer base`. **Não duplique** a media query em componentes. Use `transition` curtos com `--ease-ds` (220ms padrão); animações longas (> 360ms) precisam de justificativa.

### 2.4 Foco visível (não-negociável — WCAG 2.1 AA + edital)

- Anel de foco: **3px** em `--c-brand-300` com offset 2px.
- O Botão padrão ([`apps/web/components/ui/button.tsx`](../../../../apps/web/components/ui/button.tsx)) já implementa via `focus-visible:ring-[3px] focus-visible:ring-brand-300 focus-visible:ring-offset-2`.
- Replicar para qualquer componente interativo novo.

## 3. Idioma e tom

- **UI em pt-BR** — labels, mensagens, placeholders, errors, empty states, tooltips.
- **Identificadores de código em inglês** — `riskScore`, `caseList`, `auditorId` (não `pontuacaoDeRisco`).
- **Mensagens ao auditor**: tom sóbrio, sem jargão técnico, sem "oops!". Exemplo: "Não foi possível carregar a fila de casos. Tente novamente em instantes."
- **Mensagens ao cidadão** (módulo 4 — portal de autorregularização): linguagem ainda mais simples; sem termos técnicos fiscais (`PGDAS`, `CTC`) sem antes explicar.

## 4. Human-in-the-loop na UI (princípio do projeto)

Ver [`docs/design-system/design-system.md` §2 "Padrão transversal"](../../../../docs/design-system/design-system.md) e [`AGENTS.md` §1.1](../../../../AGENTS.md).

- Saídas de agente vêm rotuladas (`Detectado por agente`, `Fundamentado em N fontes`) — **nunca** mostradas como fato consumado.
- Botões de **efeito jurídico** usam o azul primário sólido, exigem confirmação explícita e devem disparar registro de auditoria no backend.
- Em telas que listam recomendações de IA, mantenha sempre uma ação humana visível ("Aprovar", "Recusar", "Pedir mais contexto") — não há fluxo sem decisão.

## 5. Privacidade e LGPD na UI

- **Nunca** logar dado de contribuinte no `console`. A regra `noConsole` do Biome já avisa.
- **Nunca** mandar CPF/CNPJ/valor para serviços externos do navegador (analytics, Sentry browser sem PII scrubbing, etc.) — coordene com o backend antes.
- Componentes que exibem dado sensível devem ter `<span data-sensitive>` para permitir mascaramento futuro (a regra exata virá do módulo 6).

## 6. Áreas críticas — mudanças exigem revisão

| Caminho | Por quê |
|---|---|
| [`apps/web/app/globals.css`](../../../../apps/web/app/globals.css) | Tokens do DS — qualquer alteração impacta a UI inteira. Cite a §do DS em PRs. |
| [`apps/web/app/layout.tsx`](../../../../apps/web/app/layout.tsx) | Fontes, providers, headers de metadata — mudança aqui propaga para todo o app. |
| [`apps/web/components/providers.tsx`](../../../../apps/web/components/providers.tsx) | QueryClient global — mudar `staleTime`/`retry` afeta cache em todas as queries. |
| [`apps/web/lib/api-client.ts`](../../../../apps/web/lib/api-client.ts) | Cliente HTTP central — mudanças aqui mudam toda a cadeia de custódia (correlation-id). |
| [`apps/web/next.config.ts`](../../../../apps/web/next.config.ts) | Headers de segurança (HSTS, X-Frame-Options, Permissions-Policy) — não remover sem ADR. |

## 7. Fluxo de entrega esperado

1. **Leia o DS** ([`docs/design-system/design-system.md`](../../../../docs/design-system/design-system.md)) — pelo menos as seções §3 (cor), §4 (tipografia) e §6 (movimento).
2. **Localize tokens** em `apps/web/app/globals.css` antes de inventar valores hex novos.
3. **Verifique se há shadcn** para o componente; se sim, `pnpm dlx shadcn@latest add ...` e customize via `cn()`.
4. **Idioma pt-BR** e **identificadores em inglês**.
5. **Acessibilidade**: foco visível, `aria-*`, contraste ≥ 4.5:1, suporte a teclado.
6. **`pnpm --filter @fiscalcheck/web lint && typecheck`** antes de declarar pronto.

## 8. Anti-padrões específicos do FiscalCheck

- ❌ Botão `variant="default"` para uma sugestão de IA — confunde efeito jurídico com recomendação.
- ❌ `variant="aurora"` em um botão de "Confirmar intimação" — viola human-in-the-loop.
- ❌ Espectro de risco usado decorativamente (ex.: barra de progresso de upload colorida do verde ao vermelho) — confunde a semântica do score.
- ❌ `useEffect(() => { fetch(...) }, [])` — sempre TanStack Query.
- ❌ Estado de servidor duplicado no Zustand — store é só para UI local.
- ❌ Importar `Inter`, `Arial`, ou fontes do `next/font/google` que não sejam **Raleway**, **Montserrat** ou **Roboto Mono** — quebra a identidade do DS v2.0.
- ❌ Esconder o foco com `outline: none` sem fornecer ring alternativo — barreira de acessibilidade.
