# Infra — desenvolvimento local

Composição Docker para **dev fora do Replit**. No Replit, o `replit.nix` já provisiona Postgres e Redis.

## Subir tudo

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Serviços disponíveis:

| Serviço | Porta | Notas |
|---|---|---|
| Postgres (com pgvector + Apache AGE) | 5432 | usuário/senha: `postgres`/`postgres` |
| Redis | 6379 | sem autenticação (dev only) |
| MailHog (opcional, profile `dev`) | 1025 (SMTP) / 8025 (UI) | captura e-mails de teste |

Para incluir o MailHog:

```powershell
docker compose -f infra/docker-compose.yml --profile dev up -d
```

## Validar pgvector e AGE

```sql
\c fiscocheck

-- pgvector
SELECT '[1,2,3]'::vector;

-- Apache AGE
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM ag_catalog.ag_graph WHERE name = 'fisco_graph';
```

Ambos devem retornar resultados (o grafo já é criado pelo `postgres-init.sql`).

## Resetar tudo

```powershell
docker compose -f infra/docker-compose.yml down -v
```

Isso apaga **volumes** (banco e Redis ficam zerados). Para o dia a dia, prefira `down` sem `-v`.

## Aplicar migrations

Com os containers rodando:

```powershell
cd apps/api
uv sync
uv run alembic upgrade head
```

## Não usar em produção

Esta composição não tem TLS, MFA, backup nem segregação de rede. É **dev only**. Produção fica na nuvem (a definir — ver [ADR-0001](../docs/adr/0001-stack-inicial.md)).
