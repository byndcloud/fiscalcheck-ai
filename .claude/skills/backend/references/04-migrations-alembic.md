# 04 — Migrations com Alembic

> Config em [`apps/api/alembic.ini`](../../../../apps/api/alembic.ini); env em [`apps/api/alembic/env.py`](../../../../apps/api/alembic/env.py); arquivos em [`apps/api/alembic/versions/`](../../../../apps/api/alembic/versions/).

## 1. Regra de ouro

**Migrations já aplicadas em ambientes compartilhados (develop / staging / production) são imutáveis.** Bug numa migration antiga = uma migration NOVA que corrige. Editar o arquivo existente quebra a cadeia (hash da revisão muda, ambiente já aplicado fica inconsistente).

Em **dev local antes do primeiro merge**, ainda é OK regenerar uma migration que você acabou de criar.

## 2. Comandos

Sempre dentro de `apps/api/`:

```powershell
# Gerar migration a partir do estado atual dos modelos
uv run alembic revision --autogenerate -m "modulo: descricao em pt-BR"

# Aplicar todas as migrations pendentes
uv run alembic upgrade head

# Voltar uma migration (em dev — NUNCA em produção sem plano de rollback)
uv run alembic downgrade -1

# Ver histórico
uv run alembic history

# Ver migration corrente do banco
uv run alembic current
```

Atalhos no `package.json`:

```powershell
pnpm --filter @fiscocheck/api migrate          # = uv run alembic upgrade head
pnpm --filter @fiscocheck/api migrate:new "modulo: descricao"
```

## 3. Workflow padrão

1. Altere `models.py` no módulo (ex.: novo campo em [`modules/cases/models.py`](../../../../apps/api/src/fiscocheck_api/modules/cases/models.py)).
2. Gere migration: `uv run alembic revision --autogenerate -m "cases: adicionar field X"`.
3. **Revise o arquivo gerado** — autogenerate é assistido, não infalível. Ajuste constraints, índices, defaults.
4. Aplique localmente: `uv run alembic upgrade head`.
5. Rode os testes: `uv run pytest -q`.
6. Commit + PR.

## 4. Convenção de nomenclatura

Mensagem (`-m`):

- Em pt-BR.
- Prefixe com o módulo: `cases:`, `compliance:`, `ingestion:`, `ai:`.
- Imperativo: "adicionar", "remover", "renomear", "criar índice".

Exemplos:

```
cases: adicionar status_history em audit
compliance: criar tabela audit_log append-only
ingestion: indice em nfse(competencia, cnpj_prestador_hash)
ai: tabela risk_scores com fk para cases
```

O arquivo gerado em `versions/` vai ter prefixo de hash + slug — o slug é gerado a partir da mensagem.

## 5. Migrations especiais

### 5.1 Audit log append-only

`modules/compliance` cria `audit_log` com:

```python
def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("auditor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("correlation_id", sa.String(128), nullable=False),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_auditor", "audit_log", ["auditor_id"])
    op.create_index("ix_audit_correlation", "audit_log", ["correlation_id"])

    # Revoga UPDATE/DELETE para o role do app (append-only por privilégio).
    op.execute("""
        REVOKE UPDATE, DELETE ON audit_log FROM fiscocheck_app;
    """)
    # Trigger defensiva (caso o role mude no futuro):
    op.execute("""
        CREATE OR REPLACE FUNCTION audit_log_no_modify() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'audit_log é append-only';
        END;
        $$ LANGUAGE plpgsql;
        CREATE TRIGGER audit_log_no_update
            BEFORE UPDATE OR DELETE ON audit_log
            FOR EACH ROW EXECUTE FUNCTION audit_log_no_modify();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;")
    op.execute("DROP FUNCTION IF EXISTS audit_log_no_modify();")
    op.drop_index("ix_audit_correlation")
    op.drop_index("ix_audit_auditor")
    op.drop_table("audit_log")
```

> O `revoke` exige que o role `fiscocheck_app` exista. No Replit Postgres o role é fornecido automaticamente; documente o nome em `replit.md` quando o Módulo 6 entrar.

### 5.2 Particionamento (NFS-e)

Tabelas grandes (NFS-e mensal) devem ser **particionadas por competência** desde a primeira migration — particionar depois é caro.

```python
op.execute("""
    CREATE TABLE nfse (
        id uuid PRIMARY KEY,
        competencia date NOT NULL,
        cnpj_prestador_hash text NOT NULL,
        -- ...
        UNIQUE (numero_nfse, cnpj_prestador_hash, competencia)
    ) PARTITION BY RANGE (competencia);
""")
```

### 5.3 pgvector

```python
def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.create_table(
        "copilot_chunks",
        # ...
        sa.Column("embedding", sa.dialects.postgresql.ARRAY(sa.Float), nullable=False),
    )
    # Alternativa idiomática:
    # op.execute("ALTER TABLE copilot_chunks ADD COLUMN embedding vector(1536);")
    op.execute("""
        CREATE INDEX copilot_chunks_embedding_ivfflat
        ON copilot_chunks USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    """)
```

### 5.4 Apache AGE

**Adiado para fase 2** (ver [`ADR-0002`](../../../../docs/adr/0002-database-mvp-replit.md)). Não inclua AGE em migrations do MVP no Replit; o grafo do Módulo 2 usa NetworkX in-memory + tabelas relacionais.

## 6. URL de conexão

`alembic/env.py` lê `DATABASE_URL_SYNC` (`postgresql+psycopg://...`), não `DATABASE_URL` (que é asyncpg). Alembic é sync.

Defina ambas no `.env` / Replit Secrets:

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
DATABASE_URL_SYNC=postgresql+psycopg://user:pass@host:port/db
```

## 7. Testes

- Banco de teste separado (`DATABASE_URL_TEST`).
- Fixture pytest que aplica `alembic upgrade head` antes de tudo e `alembic downgrade base` depois (ou trunca tabelas).
- Migration que cria estrutura crítica (audit_log) tem **teste dedicado** verificando:
  - `UPDATE audit_log SET ...` falha.
  - `DELETE FROM audit_log ...` falha.
  - Constraints/índices existem (consulta a `information_schema`).

## 8. Anti-padrões

- ❌ Editar arquivo em `alembic/versions/` mergeado em `main`/`develop`.
- ❌ `op.execute("TRUNCATE audit_log")` — apaga histórico.
- ❌ `nullable=True` em colunas críticas (`auditor_id`, `correlation_id`, `created_at`) — sigilo fiscal exige rastreabilidade.
- ❌ Migration sem `downgrade()` real — dificulta rollback em incidente.
- ❌ Migration de dados misturada com migration de schema — separe em revisões diferentes (mais fácil de reverter).
- ❌ Renomear coluna com `op.alter_column(..., new_column_name=...)` num único PR — quebra apps com cache antigo do schema. Adicione a nova, faça shadow-write, remova a antiga numa segunda migration.
- ❌ Confiar 100% no autogenerate. Sempre revisar.
