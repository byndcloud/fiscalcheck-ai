# `.agents/memory/`

Notas curtas e operacionais para **coding agents** (Claude Code, Cursor, Replit Agent, Copilot, etc.) que vão trabalhar neste repositório.

Cada arquivo aqui responde a uma pergunta prática recorrente que **não** é resolvida por leitura direta do código — normalmente "por que este workaround existe?" ou "por que esta linha do `.replit` é assim?". A ideia é evitar que cada agente novo redescubra sozinho o mesmo problema (e retente comandos que já falharam antes).

## O que **vai** aqui

- **Workarounds de ambiente** cujo motivo não é óbvio pelo diff (ex.: `env -u LD_LIBRARY_PATH` no `.replit`).
- **Decisões operacionais recorrentes** que os agentes precisam re-consultar durante a sessão (ex.: "por que rodamos só o web no preview do Replit").
- **Armadilhas conhecidas** que já queimaram tempo (ex.: `pnpm install` cai em 403 no firewall do Replit).

## O que **não** vai aqui

- **Decisões arquiteturais de longo prazo** — vão para [`docs/adr/`](../../docs/adr/). Ex.: ADR-0003 (estratégia de preview no Replit) é a fonte formal; as notas aqui são o resumo operacional em runtime.
- **Spec de módulo, guia de estilo, princípios não-negociáveis** — vão para [`AGENTS.md`](../../AGENTS.md), [`CLAUDE.md`](../../CLAUDE.md), [`docs/modules/`](../../docs/modules/), [`docs/design-system/`](../../docs/design-system/).
- **Segredos ou dados sensíveis** — nunca. Estas notas são commitadas.

## Como um agente consome esta pasta

1. Ao topar com um erro estranho de ambiente (Node não sobe, `pnpm install` 403, preview em branco, iframe bloqueado), **procure aqui primeiro** antes de tentar workarounds novos. Grep por palavra-chave (`LD_LIBRARY_PATH`, `firewall`, `X-Frame-Options`, etc.) resolve na maioria dos casos.
2. Se uma nota estiver desatualizada (o comportamento mudou), **atualize a nota no mesmo PR** que corrige o comportamento. Notas silenciosamente falsas são pior que ausência.
3. Se descobrir um novo workaround não trivial, adicione uma nota nova (ver "Como escrever uma nota" abaixo).

## Como escrever uma nota

Nome do arquivo: `kebab-case-descritivo.md`, com prefixo `fiscalcheck-` quando é específico do produto, ou `replit-` / `nix-` / etc. quando é específico da plataforma.

Estrutura mínima (frontmatter YAML + seções em pt-BR):

```markdown
---
name: Título curto que aparece em listagens
description: Uma linha explicando quando o agente deve ler esta nota
---

# Sintoma
O erro exato / comportamento observável que traz o leitor aqui.

# Causa
Por que isso acontece (com referências verificáveis).

# Workaround (o que fazemos)
O comando/config exato que resolve. Cole-o.

# Onde aplicar
Lista de arquivos/situações em que o workaround precisa estar presente.

# O que NÃO fazer
Retentativas conhecidamente inúteis, para evitar que o próximo agente perca tempo.
```

Notas devem ser **curtas** (uma tela, no máximo duas). Se a nota crescer, provavelmente é uma decisão arquitetural — mova para `docs/adr/`.

## Notas atuais

| Arquivo | Assunto |
|---|---|
| [`fiscalcheck-preview-model.md`](./fiscalcheck-preview-model.md) | Como o Next.js aparece no preview do Replit (webview em `PORT=5000` com MSW). |
| [`replit-env-ldlibrarypath.md`](./replit-env-ldlibrarypath.md) | Por que todo comando `node`/`pnpm` precisa de `env -u LD_LIBRARY_PATH`. |
| [`fiscalcheck-firewall-test-deps.md`](./fiscalcheck-firewall-test-deps.md) | Por que **não** removemos vitest apesar do 403 do firewall do Replit. |

## Relação com o resto da documentação

```
docs/adr/                → decisões arquiteturais permanentes (fonte formal)
AGENTS.md, CLAUDE.md     → princípios e regras de conduta dos agentes
docs/modules/            → spec funcional de cada módulo fiscal
.agents/memory/          → gambiarras operacionais e armadilhas de runtime
.claude/skills/          → skills de tarefa (frontend, backend) com workflows
```

Se algo é **regra permanente**, vai para `AGENTS.md`. Se é **decisão auditável**, vai para `docs/adr/`. Se é **truque para não perder tempo com erro conhecido**, vai aqui.
