---
name: frontend
description: >
  Crie, refatore, audite e aprimore interfaces front-end em qualquer stack.
  Use esta skill para: construção de componentes e páginas, layouts responsivos,
  auditorias de acessibilidade (a11y), otimizações de performance e bundle,
  animações e micro-interações, sistemas de design tokens, padrões de estado,
  e code review de código front-end. Acione sempre que o usuário mencionar
  componente, UI, interface, CSS, HTML, layout, tela, acessibilidade, a11y,
  bundle, responsivo, interação, animação, design system, tokens, tema, dark mode,
  formulário, modal, navegação, ou qualquer entrega visual — mesmo que não cite
  "front-end" explicitamente. Esta skill cobre qualquer framework ou stack:
  React, Vue, Svelte, Angular, Astro, Next.js, Nuxt, SvelteKit, ou Vanilla.
---

# Frontend Skill

Entregas front-end de alta qualidade: funcionais, acessíveis, performáticas
e com identidade visual genuína — sem padrões repetitivos de IA.

## Primeira referência (obrigatória)

> **`references/00-fiscalcheck-context.md`** — stack fixa (Next.js 15 + Tailwind v4 + shadcn/ui + Raleway + Montserrat + Roboto Mono), Design System v2.0, regras de cor (marca / Aurora / risco), idioma, human-in-the-loop na UI, arquivos críticos. **Leia antes de qualquer outra referência desta skill** — ele restringe e sobrepõe recomendações genéricas das demais.

## Qual referência ler

Leia **apenas** o(s) arquivo(s) relevante(s) para a tarefa atual — sempre depois do `00-fiscalcheck-context.md`.

| Tarefa                                        | Leia primeiro               | Combine com                 |
|-----------------------------------------------|-----------------------------|-----------------------------|
| Tarefa nova, pedido ambíguo                   | 00-decision-guide.md        | —                           |
| Criar ou refatorar componente                 | 01-component-patterns.md    | 06-design-tokens.md         |
| Layout, grid, breakpoints, responsividade     | 02-responsive-layout.md     | —                           |
| Auditoria, correção ou revisão de a11y        | 03-accessibility.md         | 08-code-quality.md          |
| Performance, Core Web Vitals, bundle          | 04-performance.md           | —                           |
| Animação, transição, micro-interação          | 05-animation-motion.md      | —                           |
| Design tokens, tema, dark mode, CSS vars      | 06-design-tokens.md         | 02-responsive-layout.md     |
| Gerenciamento de estado, fluxo de dados       | 07-state-patterns.md        | 01-component-patterns.md    |
| Code review, testes, convenções               | 08-code-quality.md          | —                           |
| Next.js App Router, Nuxt, SvelteKit, SSR      | 09-ssr-frameworks.md        | 01-component-patterns.md    |

Se a tarefa envolver **design visual** (escolha tipográfica, paleta, composição),
leia também `references/01-component-patterns.md` — seção "Identidade Visual".

## Detecção de stack

No FiscalCheck a stack é fixa (ver `00-fiscalcheck-context.md` §1): Next.js 15 App Router + TS estrito + Tailwind v4 + shadcn/ui. Não pergunte — assuma.

Para qualquer outra base de código (em outro projeto), identifique:
- **Framework** de componentes (React / Vue / Svelte / Angular / Vanilla)
- **Sistema de estilos** (CSS Modules / Tailwind / CSS-in-JS / plain CSS / SCSS)
- **Build tool** (Vite / Webpack / Parcel / nenhum)
- **TypeScript?** (sim / não)

Infira do contexto (imports visíveis, arquivos mencionados, extensões).
Se não for possível inferir, faça **uma única pergunta** antes de entregar código.
Nunca entregue código com sintaxe ou imports de framework sem confirmação.

## Princípios de entrega

**Código**
- Sempre entregue código completo e funcional — sem `// ...resto aqui`
- Comente decisões não-óbvias de acessibilidade, performance e semântica
- Se a tarefa exigir mudanças em múltiplos arquivos, liste-os todos explicitamente
- CSS-first: use JavaScript somente quando CSS não resolve
- Prefira soluções nativas da plataforma antes de adicionar dependências

**Identidade visual**
- Leia `references/01-component-patterns.md` (seção "Identidade Visual") para
  diretrizes completas sobre tipografia, cor, composição e motion
- Nunca use Inter/Roboto/Arial como escolha primária — são placeholder, não escolha
- Nunca use gradiente roxo em fundo branco como esquema padrão
- Nunca repita o mesmo layout card-grid para contextos diferentes sem questionar
- Toda entrega visual deve ter um ponto de vista claro: o que a torna memorável?

**Acessibilidade (não-negociável)**
- Todo componente interativo: foco visível, role correto, label descritivo
- `prefers-reduced-motion` aplicado em toda animação
- Contraste mínimo 4.5:1 para texto, 3:1 para elementos UI

## Scripts automáticos

Execute via `bash_tool` quando relevante — não requer leitura prévia do arquivo:

```bash
# Auditoria de acessibilidade (URL local obrigatória)
python /path/to/skill/scripts/audit-a11y.py <url>

# Análise de bundle (caminho do output de build)
python /path/to/skill/scripts/analyze-bundle.py <path-to-stats.json>
```

Inclua o output no contexto antes de propor correções.

## Assets disponíveis

Leia sob demanda — não carregue preventivamente:
- `assets/snippets/component-template.md` — boilerplate de componente genérico
- `assets/snippets/css-reset.md` — CSS reset moderno comentado
- `assets/snippets/common-patterns.md` — modal, drawer, toast, skeleton, accordion, **carousel**
- `assets/checklists/launch-checklist.md` — verificações pré-deploy
- `assets/checklists/review-checklist.md` — pontos de code review
