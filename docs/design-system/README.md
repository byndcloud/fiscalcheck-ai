# Design System — FiscalCheck AI

> Você (usuário) tem um documento de design system pronto em markdown. **Cole-o aqui.**

## Onde colocar o seu documento

Coloque o markdown principal em:

```text
docs/design-system/design-system.md
```

Se preferir dividir por seção (recomendado quando o DS crescer):

```text
docs/design-system/
├── README.md            ← este arquivo (índice)
├── design-system.md     ← documento principal (ou removido se dividir)
├── tokens.md            ← cores, tipografia, spacing, raio
├── componentes.md       ← regras de componentes
├── acessibilidade.md    ← WCAG 2.1 AA, focus, contraste
├── padroes-de-formulario.md
├── padroes-de-mensagens.md  ← linguagem em pt-BR para auditor e cidadão
└── changelog.md
```

## Próximos passos depois de colar o DS

1. Os **tokens** (cores, tipografia, spacing, raio) vão virar variáveis CSS em [`apps/web/app/globals.css`](../../apps/web/app/globals.css) dentro do bloco `@theme inline`.
2. Os **componentes** serão instalados via shadcn CLI:

   ```powershell
   pnpm dlx shadcn@latest add button input dialog table form
   ```

3. Eventuais **componentes customizados** (não-shadcn) ficam em `apps/web/components/<dominio>/`.
4. Considere adicionar **Storybook** quando o número de componentes passar de ~10 (ver [ADR-0001](../adr/0001-stack-inicial.md) seção "Não incluído agora").

## Princípios já definidos

Mesmo antes do DS detalhado, o projeto já adota:

- **Idioma**: pt-BR em toda a UI; jargão técnico evitado em mensagens ao auditor; linguagem ainda mais simples em mensagens ao cidadão (módulo 4).
- **Acessibilidade**: WCAG 2.1 AA como mínimo.
- **Tema**: claro e escuro (variáveis CSS em `:root` e `.dark`).
- **Sem `any`** em CSS: tudo via tokens.
- **Foco visível** sempre que houver navegação por teclado.
