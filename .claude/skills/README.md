# `.claude/skills/` — Skills do Claude Code

Esta pasta contém **skills** que o Claude Code (e Replit Agent) deve consultar antes de executar tarefas específicas.

## Skills ativas

| Pasta | `name` | Quando o agente deve ativar |
|---|---|---|
| [`frontend/`](./frontend/) | `frontend` | Qualquer mudança em `apps/web/**` — componentes, páginas, layout, a11y, performance, design tokens, animação |
| [`backend/`](./backend/) | `backend` | Qualquer mudança em `apps/api/**` — endpoints, modelos SQLAlchemy, ETL, agentes LangGraph, migrations Alembic |
| [`qa-test-strategist/`](./qa-test-strategist/) | `qa-test-strategist` | Planejar testes, decidir mix (unit / integração / contract / e2e / property / evals de LLM), auditar suíte |
| [`security-auditor/`](./security-auditor/) | `security-auditor` | Revisar PR/diff/módulo por segurança (LGPD, sigilo fiscal, RBAC, IDOR, injeção, segredos, etc.) |

Cada skill carrega o contexto FiscoCheck em `references/00-fiscocheck-context.md` (leitura obrigatória antes das demais referências da mesma skill).

## Formato esperado de cada skill

Cada skill é uma pasta com um `SKILL.md` no formato:

```markdown
---
name: backend
description: Use this skill when modifying Python backend code...
---

# Conteúdo da skill...
```

O `name` é o identificador (lowercase, sem espaços) e o `description` é o gatilho — o Claude Code lê este campo para decidir quando ativar a skill.

## Como o Claude Code usa

Quando o usuário pede uma tarefa que case com o `description` de uma skill, o Claude lê o `SKILL.md` correspondente **antes** de agir e segue as instruções.

> Skills NÃO são executadas como scripts. São documentos de instrução estruturada para o agente.

## Convenções deste projeto

- **Idioma**: `references/00-fiscocheck-context.md` e qualquer conteúdo novo deste repo em pt-BR. Skills genéricas podem manter referências em inglês quando vieram prontas (são documentos de boa qualidade que não duplicaremos).
- **Escopo**: o contexto FiscoCheck mora em `references/00-fiscocheck-context.md`. As outras referências podem ser genéricas — o agente combina as duas camadas.
- **Referências**: cite arquivos do repo com caminho relativo (`apps/api/...`).
- **LGPD e sigilo**: skills de `backend` e `security-auditor` reforçam pseudonimização, RBAC, audit log append-only.

## Adicionando uma skill nova

1. Crie a pasta: `.claude/skills/<nome-em-kebab-case>/`.
2. Crie `SKILL.md` com frontmatter `name` + `description`.
3. Crie `references/00-fiscocheck-context.md` com o recorte FiscoCheck (princípios, arquivos críticos, gatilhos automáticos).
4. (Opcional) Adicione `scripts/`, `assets/`, demais `references/`.
5. Atualize a tabela acima e a tabela em [`../../CLAUDE.md`](../../CLAUDE.md) §1.

## Skills úteis para considerar no futuro

- `etl-fiscal/` — padrões finos de ETL para NFS-e, DIMP, PGDAS (Polars + idempotência) — hoje cobertos parcialmente pela skill `backend`.
- `agente-langgraph/` — padrões para criar novos agentes stateful com human-in-the-loop — hoje cobertos pela skill `backend`.
- `migration-segura/` — gerar migrations Alembic sem corromper audit logs — hoje coberto pela skill `backend`.
- `revisao-de-cruzamento/` — checklist específico do módulo 2.
- `revisao-de-modelo-ml/` — checklist específico do módulo 3.
