# Replit — Guia de execução

Este projeto roda **direto no Replit** sem ajustes manuais: o [`replit.nix`](./replit.nix) provisiona Node 22, Python 3.12, PostgreSQL 16 e Redis; o [`.replit`](./.replit) configura portas e workflows.

> Para leitura do agent (Claude Code / Replit Agent), o [`CLAUDE.md`](./CLAUDE.md) é o ponto de partida. Este arquivo trata da operação humana no Replit.

---

## 1. Criar o Repl

1. **Create Repl → Import from GitHub** → selecione o repositório `fiscocheck-ai`.
2. Aguarde o Replit baixar dependências do Nix (primeira vez leva 3–5 minutos).
3. O botão **Run** já está configurado para subir o workflow `Dev (web + api)`.

---

## 2. Secrets (variáveis sensíveis)

No painel **Secrets** do Replit, configure pelo menos:

| Chave | Origem |
|---|---|
| `DATABASE_URL` | Replit Postgres (ou seu próprio) |
| `REDIS_URL` | Replit Redis (ou seu próprio) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | URL pública do Repl (ex.: `https://fiscocheck-ai.<usuario>.repl.co`) |
| `NEXT_PUBLIC_API_URL` | URL pública da API |
| `OPENAI_API_KEY` | OpenAI (módulos 3 e 7) |
| `PSEUDONYMIZATION_SALT` | `openssl rand -hex 32` (não compartilhar com JWT_SECRET) |

A lista completa está em [`.env.example`](./.env.example).

> **NUNCA** cole valores reais em arquivos versionados. Tudo entra pelo painel Secrets.

---

## 3. Workflows configurados

| Workflow | Comando | Quando usar |
|---|---|---|
| `Dev (web + api)` | `pnpm dev` | Default. Sobe Next.js (porta 3000) e FastAPI (porta 8000) em paralelo. |
| `Web only` | `pnpm web:dev` | Trabalhando só no frontend. |
| `API only` | `pnpm api:dev` | Trabalhando só no backend / agentes. |
| `Tests (all)` | `pnpm test` | Validar antes de PR. |
| `DB migrate` | `pnpm --filter @fiscocheck/api migrate` | Aplicar migrations Alembic (`alembic upgrade head`). |

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

Para experimentar a stack completa com `Apache AGE` (útil ao preparar a migração para nuvem nacional), use o `docker-compose` em [`infra/docker-compose.yml`](./infra/docker-compose.yml) **fora** do Replit — a imagem `apache/age:PG16_latest` já inclui o pacote de extensões e o init em [`infra/postgres-init-age.sql`](./infra/postgres-init-age.sql) cria o grafo `fisco_graph`.

---

## 5. Portas expostas

| Porta interna | Porta externa | Serviço |
|---|---|---|
| 3000 | 80 (HTTPS público) | Next.js (frontend) |
| 8000 | 8000 | FastAPI (backend) |

PostgreSQL e Redis são serviços **gerenciados pelo Replit** — o app conecta neles pela URL injetada em Secrets (`DATABASE_URL`, `REDIS_URL`), e por isso eles não aparecem como `localPort` no [`.replit`](./.replit). Para dev local fora do Replit, suba o Postgres/Redis via [`infra/docker-compose.yml`](./infra/docker-compose.yml).

---

## 6. Always On (piloto)

Os agentes do módulo 1 (ingestão) e 2 (cruzamento) operam **24/7**. Para o piloto:

1. Vá em **Repl Settings → Always On** e ative.
2. Configure scheduled tasks dentro do FastAPI (Celery beat ou APScheduler).
3. Para produção real, **migrar para AWS/Azure Brasil** — o Replit não tem certificação LGPD adequada para dados fiscais em produção.

---

## 7. Troubleshooting

| Sintoma | Provável causa | Solução |
|---|---|---|
| `pnpm: command not found` | Corepack não inicializado | `corepack enable && corepack prepare pnpm@latest --activate` |
| `uv: command not found` | `replit.nix` não foi rebuildado | Stop Repl → Run novamente (rebuilda Nix) |
| `Postgres: connection refused` | Serviço Postgres do Replit não iniciou | Reabra a aba **Database** no Replit |
| `pgvector: extension does not exist` | Extensão não instalada | Rodar `CREATE EXTENSION vector` no Postgres |
| Next.js 504 no `localhost:3000` | API caiu | `pnpm api:dev` para reiniciar só a API |
| Logs misturados no console | Workflow paralelo | Use **Shell** separado: `pnpm web:dev` em um e `pnpm api:dev` em outro |

---

## 8. Deploy (produção)

O `.replit` já tem a seção `[deployment]` configurada para **Replit Deployments → Cloud Run**, com `run = "pnpm dev"` (sobe web + api em paralelo). Isso é adequado apenas para a fase de **piloto/demo**.

> **Atenção LGPD:** dados fiscais reais exigem **localização nacional** dos dados. Replit hospeda em US; para produção, migrar para **AWS São Paulo**, **Azure Brazil South** ou nuvem do TCE/SC. Replit Deployments é adequado apenas para a fase de piloto.

Veja [`docs/adr/0001-stack-inicial.md`](./docs/adr/0001-stack-inicial.md) e [`docs/adr/0002-database-mvp-replit.md`](./docs/adr/0002-database-mvp-replit.md) para o registro dessas decisões.

---

## 9. Quem mantém este arquivo

Atualize quando:

- Mudar o `replit.nix` (novas deps Nix)
- Mudar portas no `.replit`
- Adicionar workflow novo
- Trocar provedor de banco/cache no Replit
