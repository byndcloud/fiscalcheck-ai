---
name: backend
description: >
  Use esta skill para qualquer mudança em apps/api/** — FastAPI + SQLAlchemy 2.0
  async + Alembic + LangGraph + Polars. Acione quando o usuário pedir endpoint
  novo, schema novo, agente novo, ETL, migration, mudança em modelo SQLAlchemy,
  audit log, pseudonimização, logging estruturado, autenticação/RBAC, ou qualquer
  arquivo em apps/api/src/fiscalcheck_api/. Use também quando o usuário falar em
  "rota", "endpoint", "modelo", "repository", "service", "router", "task de
  ingestão", "agente fiscal", "graph", "vetor", "embedding", "openapi", "pydantic",
  "alembic", "polars" ou "FastAPI".
---

# Backend Skill — FiscalCheck AI

Entregas de backend que casam com o domínio fiscal: corretas, auditáveis, type-safe e que respeitam human-in-the-loop, LGPD e sigilo fiscal **por padrão**.

## Primeira referência (obrigatória)

> **`references/00-fiscalcheck-context.md`** — princípios não-negociáveis, estrutura de pastas, comandos `uv`, arquivos críticos. Leia antes de qualquer outra referência desta skill.

## Qual referência ler

| Tarefa | Leia primeiro |
|---|---|
| Endpoint novo, schema novo, repository novo | `references/01-estrutura-de-modulos.md` |
| ETL multifonte (NFS-e, DIMP, PGDAS, ECD, DEFIS) | `references/02-etl-polars.md` |
| Agente LangGraph (com human-in-the-loop) | `references/03-agentes-langgraph.md` |
| Migration Alembic, mudança de schema | `references/04-migrations-alembic.md` |
| Logging, correlation-id, pseudonimização | `references/05-logging-pseudonimizacao.md` |

## Princípios de entrega

**Código**

- Python 3.12 com type hints completos. Use sintaxe nativa PEP 604 (`str | None`) e PEP 695 (`type X = ...`).
- `from __future__ import annotations` é tolerado quando ajuda em forward refs / typing-only — não remova quando já estiver presente.
- Async/await em endpoints. `sync_to_async` para libs bloqueantes.
- Estrutura por módulo: cada pasta em [`apps/api/src/fiscalcheck_api/modules/`](../../../apps/api/src/fiscalcheck_api/modules/) tem `router.py`, `schemas.py`, `service.py`, `models.py`, `repository.py` (`__init__.py` para expor).
- Sem `print()`. Sem `# type: ignore` sem comentário explicando por quê. Sem `Any` sem justificativa.
- Comentários **só** explicam intenção, trade-offs, regra fiscal não-óbvia. Não narram código.

**Domínio fiscal**

- Toda regra fiscal nova tem **teste** (golden test para cruzamento e score). Veja a skill `qa-test-strategist`.
- Toda ação com efeito sobre o contribuinte tem **`auditor_id`** + **`correlation_id`** + **timestamp** registrados no audit log (append-only).
- Antes de enviar qualquer dado identificável a um LLM externo, **pseudonimize** com `pseudonymize()` de [`core/security.py`](../../../apps/api/src/fiscalcheck_api/core/security.py).
- Cite a **fonte legal** (artigo, inciso, anexo do edital) em docstrings de regras fiscais.

**Mensagens de erro**

- Em pt-BR, claras, sem jargão técnico, sem stack trace na resposta.
- Sempre incluir `error_code` (string estável) + `correlation_id`.
- Stack trace e contexto interno vão **só** para o log estruturado.

## Checklist antes de declarar pronto

```powershell
cd apps/api
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest -q
```

Para mudanças que afetam schema:

```powershell
uv run alembic revision --autogenerate -m "modulo: descricao curta em pt-BR"
# revisar o arquivo gerado em alembic/versions/ antes de commitar
uv run alembic upgrade head
```

## Anti-padrões

- ❌ `logger.info("auditor processou %s", cpf)` — PII em log nível INFO.
- ❌ `openai.chat.completions.create(messages=[{"content": f"analise o CPF {cpf}"}])` — PII para LLM externo.
- ❌ Editar arquivo existente em `alembic/versions/` — sempre uma migration nova.
- ❌ Endpoint que retorna dado de contribuinte sem `Depends(get_current_user)` + checagem de papel.
- ❌ `from __future__ import annotations` removido só por estética (mantém quando já está).
- ❌ Usar `requests` (sync) em endpoint async — use `httpx.AsyncClient`.
- ❌ Tabela de audit log com permissão `UPDATE`/`DELETE` para o role do app.
- ❌ Default real de segredo em `Settings` sem validator para falhar em `staging`/`production`.

## Quando não tem certeza

- Decisão jurídica/fiscal? Pergunte ao usuário antes — não adivinhe.
- Falta ADR para uma escolha grande? Proponha um em [`docs/adr/`](../../../docs/adr/) em vez de decidir silenciosamente.
- Mudança toca compliance? Acione a skill `security-auditor` para revisão.
