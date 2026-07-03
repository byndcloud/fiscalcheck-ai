# Replit — Guia de execução

Este projeto roda **direto no Replit** sem ajustes manuais: os `modules` do [`.replit`](./.replit) provisionam Node 22, Python 3.12 e o **Postgres gerenciado** do Replit; o [`replit.nix`](./replit.nix) complementa com `pnpm`, `uv` e utilitários de CLI.

> Para leitura do agent (Claude Code / Replit Agent), o [`CLAUDE.md`](./CLAUDE.md) é o ponto de partida. Este arquivo trata da operação humana no Replit.

---

## 1. Criar o Repl

1. **Create Repl → Import from GitHub** → selecione o repositório `fiscalcheck-ai`.
2. Aguarde o Replit baixar dependências (primeira vez leva 3–5 minutos).
3. O botão **Run** já está configurado para subir o workflow `Dev (web + api)`.

---

## 2. Secrets (variáveis sensíveis)

No painel **Secrets** do Replit, configure pelo menos:

| Chave | Origem |
| --- | --- |
| `DATABASE_URL` | Replit Postgres (aba Database) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | URL pública do Repl (ex.: `https://fiscalcheck-ai.<usuario>.repl.co`) |
| `NEXT_PUBLIC_API_URL` | URL pública da API |
| `OPENAI_API_KEY` | OpenAI (módulos 3 e 7, quando implementados) |
| `PSEUDONYMIZATION_SALT` | `openssl rand -hex 32` (não compartilhar com JWT_SECRET) |

A lista completa está em [`.env.example`](./.env.example).

> **NUNCA** cole valores reais em arquivos versionados. Tudo entra pelo painel Secrets.

> **Redis não faz parte do MVP.** O Replit não oferece Redis gerenciado; quando cache/fila for necessário (módulos futuros), a opção será um provedor externo (ex.: Upstash) ou a migração para nuvem nacional — registrar em ADR na ocasião.

---

## 3. Workflows configurados

| Workflow | Comando | Quando usar |
| --- | --- | --- |
| `Dev (web + api)` | `pnpm dev` | Default. Sobe Next.js (porta 3000) e FastAPI (porta 8000) em paralelo. |
| `Web only` | `pnpm web:dev` | Trabalhando só no frontend. |
| `API only` | `pnpm api:dev` | Trabalhando só no backend / agentes. |
| `Tests (all)` | `pnpm test` | Validar antes de PR. |
| `DB migrate` | `pnpm --filter @fiscalcheck/api migrate` | Aplicar migrations Alembic (`alembic upgrade head`). |

Trocar de workflow: clique na seta ao lado do botão **Run** → escolha.

---

## 4. Banco e extensões

O Replit Postgres (gerenciado, backend Neon) **suporta `pgvector`** mas **não suporta Apache AGE**. Por isso, no MVP usamos só `pgvector` — o grafo do Módulo 2 vive em **NetworkX in-memory** no `apps/api`. Decisão completa em [ADR-0002](./docs/adr/0002-database-mvp-replit.md).

Para habilitar as extensões mínimas:

```sql
-- Conecte no DB pela aba Database do Replit (psql) e rode:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;
```

Para experimentar a stack completa com `Apache AGE` (útil ao preparar a migração para nuvem nacional), use o `docker-compose` em [`infra/docker-compose.yml`](./infra/docker-compose.yml) **fora** do Replit — perfil `graph` (ver [`infra/README.md`](./infra/README.md)).

---

## 5. Portas expostas

| Porta interna | Porta externa | Serviço |
| --- | --- | --- |
| 3000 | 80 (HTTPS público) | Next.js (frontend) |
| 8000 | 8000 | FastAPI (backend) |

O PostgreSQL é serviço **gerenciado pelo Replit** — o app conecta pela URL injetada em Secrets (`DATABASE_URL`), por isso 5432 não aparece como `localPort` no [`.replit`](./.replit). Para dev local fora do Replit, suba o Postgres via [`infra/docker-compose.yml`](./infra/docker-compose.yml).

---

## 6. Always On (piloto)

Os agentes do módulo 1 (ingestão) e 2 (cruzamento) operarão **24/7** quando implementados. Para o piloto:

1. Vá em **Repl Settings → Always On** e ative.
2. Configure scheduled tasks dentro do FastAPI (APScheduler).
3. Para produção real, **migrar para AWS/Azure Brasil** — o Replit não tem certificação LGPD adequada para dados fiscais em produção.

---

## 7. Troubleshooting

| Sintoma | Provável causa | Solução |
| --- | --- | --- |
| `pnpm: command not found` | Nix não rebuildado | Stop Repl → Run novamente (rebuilda o ambiente) |
| `uv: command not found` | `replit.nix` não foi rebuildado | Idem |
| `Postgres: connection refused` | Serviço Postgres do Replit não iniciou | Reabra a aba **Database** no Replit |
| `pgvector: extension does not exist` | Extensão não instalada | Rodar `CREATE EXTENSION vector` no Postgres |
| Next.js 504 no `localhost:3000` | API caiu | `pnpm api:dev` para reiniciar só a API |
| Logs misturados no console | Workflow paralelo | Use **Shell** separado: `pnpm web:dev` em um e `pnpm api:dev` em outro |

---

## 8. Deploy (piloto/demo)

A seção `[deployment]` do [`.replit`](./.replit) roda **build de produção**: `pnpm build` + `uv sync` no build, e `next start` + `uvicorn` (sem `--reload`) no run. Nunca use os dev servers em deployment.

> **Atenção LGPD:** dados fiscais reais exigem **localização nacional** dos dados. Replit hospeda em US; para produção, migrar para **AWS São Paulo**, **Azure Brazil South** ou nuvem do TCE/SC. Replit Deployments é adequado apenas para a fase de piloto.

Veja [`docs/adr/0001-stack-inicial.md`](./docs/adr/0001-stack-inicial.md) e [`docs/adr/0002-database-mvp-replit.md`](./docs/adr/0002-database-mvp-replit.md) para o registro dessas decisões.

---

## 9. Quem mantém este arquivo

Atualize quando:

- Mudar o `replit.nix` ou os `modules` do `.replit`
- Mudar portas no `.replit`
- Adicionar workflow novo
- Trocar provedor de banco no Replit
