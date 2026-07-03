# Replit — Guia de execução

Este projeto roda **direto no Replit** sem ajustes manuais: os `modules` do [`.replit`](./.replit) provisionam Node 22, Python 3.12 e o **Postgres gerenciado** do Replit; o [`replit.nix`](./replit.nix) complementa com `pnpm`, `uv` e utilitários de CLI.

> Para leitura do agent (Claude Code / Replit Agent), o [`CLAUDE.md`](./CLAUDE.md) é o ponto de partida. Este arquivo trata da operação humana no Replit.

---

## 1. Criar o Repl

1. **Create Repl → Import from GitHub** → selecione o repositório `fiscalcheck-ai`.
2. Aguarde o Replit baixar dependências (primeira vez leva 3–5 minutos).
3. O botão **Run** está configurado (via `runButton = "Project"` no [`.replit`](./.replit)) para subir o workflow `Project`, que executa `Start application` — Next.js + MSW em preview na porta 5000, sem depender da FastAPI. O workflow `Dev (web + api)` continua disponível na lista para uso manual quando quiser subir front + back juntos. Motivo: [ADR-0003](./docs/adr/0003-preview-replit.md).

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
| `Project` | delega para `Start application` (webview em `PORT=5000`) | **Default** do botão Run. Único workflow com `outputType = "webview"` — é o que aparece no preview do Replit. |
| `Start application` | `env -u LD_LIBRARY_PATH PORT=5000 NEXT_PUBLIC_MSW_ENABLED=true pnpm --filter @fiscalcheck/web dev` | Task interna executada pelo `Project`. Não iniciar manualmente. |
| `Dev (web + api)` | `pnpm --filter @fiscalcheck/web dev` + `pnpm --filter @fiscalcheck/api dev` em paralelo | Subir front + back juntos no shell (não aparece no preview do Replit — este workflow não é webview). |
| `Web only` | `pnpm --filter @fiscalcheck/web dev` | Trabalhando só no frontend fora do preview. |
| `API only` | `pnpm --filter @fiscalcheck/api dev` | Trabalhando só no backend / agentes. |
| `Tests (all)` | `pnpm test` | Validar antes de PR. |
| `DB migrate` | `pnpm --filter @fiscalcheck/api migrate` | Aplicar migrations Alembic (`alembic upgrade head`). |

Trocar de workflow: clique na seta ao lado do botão **Run** → escolha. Racional das duas primeiras entradas está em [ADR-0003](./docs/adr/0003-preview-replit.md); prefixo `env -u LD_LIBRARY_PATH` documentado em [`.agents/memory/replit-env-ldlibrarypath.md`](./.agents/memory/replit-env-ldlibrarypath.md).

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
| 5000 | 5000 | Next.js webview do preview (workflow `Project`; porta canônica do ADR-0003) |
| 8080 | 80 (HTTPS público) | Fallback HTTPS externo do webview |
| 23345 | 3000 | Mapping legado para quando alguém roda o Next.js na porta 3000 manualmente |
| 8000 | 8000 | FastAPI (quando `Dev (web + api)` ou `API only` está ativa) |

> **Removido**: o antigo `3000 → 80` colidia com `8080 → 80`. O preview canônico usa 5000; o mapping legado para a porta 3000 sai via `23345 → 3000`.

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
| `pnpm ... GLIBC/libcrypto not found` (Node aborta antes de qualquer comando) | `LD_LIBRARY_PATH` do `replit.nix` aponta para libs incompatíveis com o Node modular do Replit | Rode via workflows (`Project`, `Dev (web + api)`, etc. — já prefixadas com `env -u LD_LIBRARY_PATH`) ou use o prefixo em shell manual. Detalhes em [`.agents/memory/replit-env-ldlibrarypath.md`](./.agents/memory/replit-env-ldlibrarypath.md). |
| `ERR_PNPM_FETCH_403` em `vitest*.tgz`, `@testing-library/*` ou `jsdom` | Firewall de pacotes do Replit (`package-firewall.replit.local`) | O [`.pnpmfile.cjs`](./.pnpmfile.cjs) já detecta o repl e strip essas devDeps automaticamente. Use `pnpm install` (sem `--frozen-lockfile`). Detalhes em [`.agents/memory/fiscalcheck-firewall-test-deps.md`](./.agents/memory/fiscalcheck-firewall-test-deps.md). |
| Preview em branco / `Cannot GET /` | Workflow ativa não é `outputType = webview` | Selecione o workflow `Project` (Run button padrão). Só ele exibe no preview. |
| Iframe do preview bloqueado (`X-Frame-Options: DENY`) | Header enviado em dev por engano | Confirmar que [`apps/web/next.config.ts`](./apps/web/next.config.ts) mantém o header como **condicional** (só em produção). Ver ADR-0003 §Decisão. |
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
- Mudar portas no `.replit` — sincronize a tabela §5 e, se for mudança estrutural, atualize [ADR-0003](./docs/adr/0003-preview-replit.md)
- Adicionar/remover workflow — sincronize a tabela §3 e a nota do §1
- Trocar provedor de banco no Replit
