# Infra — desenvolvimento local

Composição Docker para **dev fora do Replit**. No Replit, use o Postgres e o Redis gerenciados (ver [`replit.md`](../replit.md)).

## Perfis disponíveis

| Perfil | Serviços | Quando usar |
| --- | --- | --- |
| `default` (sem flag) | `postgres` (`postgres:16-alpine` + `pgvector`) + `redis` | Espelha o MVP no Replit. Use no dia a dia. |
| `graph` | `postgres-age` (`apache/age:PG16_latest` com `pgvector` + `Apache AGE`) + `redis` | Exercitar o `AgeGraphStore` em preparação à migração para nuvem nacional. **Não** é a topologia do MVP. |
| `dev` | `mailhog` (1025 SMTP / 8025 UI) | Capturar e-mails de teste localmente. |

Decisão de manter AGE como opt-in: [ADR-0002](../docs/adr/0002-database-mvp-replit.md).

## Subir

```powershell
# Default (MVP): postgres + pgvector + redis
docker compose -f infra/docker-compose.yml up -d

# Com Apache AGE (em vez do postgres default)
docker compose -f infra/docker-compose.yml --profile graph up -d

# Com mailhog
docker compose -f infra/docker-compose.yml --profile dev up -d
```

> Os serviços `postgres` (default) e `postgres-age` (graph) usam a **mesma porta 5432**. Não suba os dois ao mesmo tempo.

## Validar extensões

```sql
\c fiscalcheck

-- pgvector (em ambos os perfis)
SELECT '[1,2,3]'::vector;

-- Apache AGE (apenas no perfil graph)
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM ag_catalog.ag_graph WHERE name = 'fiscal_graph';
```

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

Esta composição não tem TLS, MFA, backup nem segregação de rede. É **dev only**. Produção fica em nuvem nacional gerenciada (a definir em ADR específico).
