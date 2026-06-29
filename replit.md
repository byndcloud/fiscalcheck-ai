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

Trocar de workflow: clique na seta ao lado do botão **Run** → escolha.

---

## 4. Banco e extensões

O Replit Postgres **não** vem com `pgvector` ou `Apache AGE` por padrão. Para o piloto:

```sql
-- Conecte no DB (psql ou shell do Replit) e rode:
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS age;
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT create_graph('fisco_graph');
```

Para dev local fora do Replit, use o `docker-compose` em [`infra/docker-compose.yml`](./infra/docker-compose.yml) — a imagem `apache/age` já inclui ambas as extensões.

> Se o módulo 2 (graph analytics) ainda não estiver em uso, AGE pode ser pulado.

---

## 5. Portas expostas

| Porta interna | Porta externa | Serviço |
|---|---|---|
| 3000 | 80 (HTTPS público) | Next.js (frontend) |
| 8000 | 8000 | FastAPI (backend) |
| 5432 | 5432 | PostgreSQL |
| 6379 | 6379 | Redis |

A configuração está no [`.replit`](./.replit).

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

O `.replit` já tem a seção `[deployment]` configurada para **Replit Deployments → Cloud Run**, mas:

> **Atenção LGPD:** dados fiscais reais exigem **localização nacional** dos dados. Replit hospeda em US; para produção, migrar para **AWS São Paulo**, **Azure Brazil South** ou nuvem do TCE/SC. Replit Deployments é adequado apenas para a fase de piloto.

Veja o ADR [`docs/adr/0001-stack-inicial.md`](./docs/adr/0001-stack-inicial.md) para o registro dessa decisão.

---

## 9. Quem mantém este arquivo

Atualize quando:

- Mudar o `replit.nix` (novas deps Nix)
- Mudar portas no `.replit`
- Adicionar workflow novo
- Trocar provedor de banco/cache no Replit
