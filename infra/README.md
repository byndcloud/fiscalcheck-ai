# Infra — desenvolvimento local

Composição Docker para **dev fora do Replit**. No Replit, use o Postgres gerenciado (ver [`replit.md`](../replit.md)).

## Serviços

| Serviço | Como sobe | Quando usar |
| --- | --- | --- |
| `postgres` (`pgvector/pgvector:pg16`) | `docker compose up -d` | Espelha o MVP no Replit (Postgres + pgvector). Use no dia a dia. |
| `postgres-age` (`apache/age:PG16_latest`, porta **5433**) | `docker compose --profile graph up -d` | Exercitar o `AgeGraphStore` em preparação à migração para nuvem nacional. **Não** é a topologia do MVP. |

Decisão de manter AGE como opt-in: [ADR-0002](../docs/adr/0002-database-mvp-replit.md).

## Subir

```powershell
# MVP: postgres + pgvector (porta 5432)
docker compose -f infra/docker-compose.yml up -d

# Adicional com Apache AGE (porta 5433, pode coexistir com o default)
docker compose -f infra/docker-compose.yml --profile graph up -d
```

## Validar extensões

```sql
\c fiscalcheck

-- pgvector (em ambos os serviços)
SELECT '[1,2,3]'::vector;

-- Apache AGE (apenas no postgres-age)
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM ag_catalog.ag_graph WHERE name = 'fiscal_graph';
```

## Resetar tudo

```powershell
docker compose -f infra/docker-compose.yml down -v
```

Isso apaga **volumes** (banco fica zerado). Para o dia a dia, prefira `down` sem `-v`.

## Aplicar migrations

Com os containers rodando:

```powershell
cd apps/api
uv sync
uv run alembic upgrade head
```

## Não usar em produção

Esta composição não tem TLS, MFA, backup nem segregação de rede. É **dev only**. Produção fica em nuvem nacional gerenciada (a definir em ADR específico).
