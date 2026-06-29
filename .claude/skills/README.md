# `.claude/skills/` — Skills do Claude Code

Esta pasta contém **skills** que o Claude Code (e Replit Agent) deve consultar antes de executar tarefas específicas.

## Skills esperadas

> Você (mantenedor) já tem skills prontas em outro lugar. Copie/cole cada uma como uma pasta aqui:

| Skill | Pasta esperada | Status |
|---|---|---|
| Frontend | `frontend/SKILL.md` | a importar |
| Backend (a refinar para dados fiscais) | `backend/SKILL.md` | a importar |
| QA | `qa/SKILL.md` | a importar |
| Security Auditor | `security-auditor/SKILL.md` | a importar |

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

- **Idioma**: skills em pt-BR (alinhado ao público mantenedor).
- **Escopo**: focado no FiscoCheck AI (não duplicar conhecimento genérico do Claude).
- **Referências**: cite arquivos do repo com caminho relativo (`apps/api/...`).
- **LGPD e sigilo**: skills de backend e security-auditor devem reforçar pseudonimização e RBAC.

## Adicionando uma skill nova

1. Crie a pasta: `.claude/skills/<nome-em-kebab-case>/`.
2. Crie o arquivo `SKILL.md` com frontmatter `name` + `description`.
3. (Opcional) Adicione arquivos de apoio (`scripts/`, `reference/`, `templates/`) na mesma pasta.
4. Atualize a tabela acima.

## Skills úteis para considerar no futuro

- `etl-fiscal/` — padrões de ETL para NFS-e, DIMP, PGDAS (Polars + idempotência).
- `agente-langgraph/` — padrões para criar novos agentes stateful com human-in-the-loop.
- `migration-segura/` — gerar migrations Alembic sem corromper audit logs.
- `revisao-de-cruzamento/` — checklist para revisar regras do módulo 2.
- `revisao-de-modelo-ml/` — checklist para revisar mudanças no módulo 3.

> Quando você quiser refinar a skill de **backend** para volume de dados fiscais, me chame — anexo Polars, particionamento, streaming de NFS-e, idempotência de ETL e Apache AGE.
