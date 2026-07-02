---
name: frontend
description: >
  Crie, refatore, audite e aprimore interfaces front-end do FiscalCheck AI
  (apps/web). Use esta skill para: construção de componentes e páginas,
  layouts responsivos, auditorias de acessibilidade (a11y), otimizações de
  performance e bundle, animações e micro-interações, design tokens, padrões
  de estado, e code review de código front-end. Acione sempre que o usuário
  mencionar componente, UI, interface, CSS, layout, tela, acessibilidade,
  a11y, responsivo, animação, design system, tokens, tema, formulário, modal,
  navegação, ou qualquer entrega visual — mesmo que não cite "front-end"
  explicitamente.
---

# Frontend Skill

Entregas front-end de alta qualidade: funcionais, acessíveis, performáticas
e alinhadas ao Design System do FiscalCheck.

## Referência obrigatória

> **`references/00-fiscalcheck-context.md`** — stack fixa (Next.js 15 + Tailwind v4 + shadcn/ui + Raleway + Montserrat + Roboto Mono), Design System v2.0, regras de cor (marca / Aurora / risco), idioma, human-in-the-loop na UI, arquivos críticos. **Leia antes de qualquer entrega.**

Para detalhes visuais completos (tipografia, paleta, componentes, motion), consulte `docs/design-system/design-system.md`.

## Stack (fixa — não pergunte)

Next.js 15 App Router + TypeScript estrito + Tailwind v4 + shadcn/ui + TanStack Query v5 + Zustand (só estado de UI). Ver `00-fiscalcheck-context.md` §1 e `AGENTS.md` §4.1.

## Princípios de entrega

**Código**

- Sempre entregue código completo e funcional — sem `// ...resto aqui`
- Comente decisões não-óbvias de acessibilidade, performance e semântica
- Se a tarefa exigir mudanças em múltiplos arquivos, liste-os todos explicitamente
- CSS-first: use JavaScript somente quando CSS não resolve
- Prefira soluções nativas da plataforma antes de adicionar dependências
- Server Components por padrão; `"use client"` só onde necessário

**Identidade visual**

- Siga o Design System v2.0 (`docs/design-system/design-system.md`) — tipografia, paleta, espaçamento, elevação e motion já estão definidos; não invente esquemas alternativos
- Toda saída de IA na UI usa a camada visual Aurora (variantes dedicadas)

**Acessibilidade (não-negociável)**

- Todo componente interativo: foco visível, role correto, label descritivo
- `prefers-reduced-motion` aplicado em toda animação
- Contraste mínimo 4.5:1 para texto, 3:1 para elementos UI

**Idioma**

- Textos de UI e mensagens de erro voltadas ao auditor: pt-BR
- Identificadores de código: inglês
