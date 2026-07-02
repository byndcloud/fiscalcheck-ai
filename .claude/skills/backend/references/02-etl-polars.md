# 02 — ETL com Polars (Módulo 1)

> Spec do módulo em [`docs/modules/01-ingestao.md`](../../../../docs/modules/01-ingestao.md). Decisão de stack em [`ADR-0001`](../../../../docs/adr/0001-stack-inicial.md).

## 1. Por que Polars

Para volumes fiscais (NFS-e, DIMP, ECD, DEFIS, PGDAS) o Polars é 5–10x mais rápido que Pandas e tem **lazy execution** + **streaming** prontos. Não use Pandas em pipeline novo de produção.

## 2. Princípios

1. **Idempotência** — rodar a mesma carga 2x produz o mesmo estado final. Use upsert por chave natural + dedupe.
2. **Schema explícito** — declare o schema esperado (`pl.read_csv(..., schema_overrides={...})`); rejeite payload com schema drift.
3. **Pseudonimização desde a origem** — CPF/CNPJ são hash-eados antes de cair em tabela. PII bruta só passa por memória.
4. **Streaming para arquivos grandes** — use `pl.scan_*` (lazy) + `.collect(streaming=True)` quando o arquivo passar de ~1 GB.
5. **Particionamento por competência** — tabelas grandes (NFS-e) particionam por `YYYY-MM` para retenção e expurgo controlado.
6. **Audit de carga** — toda execução registra `run_id`, `source`, `rows_in`, `rows_out`, `rejected`, `duration_ms` em `ingestion_runs`.

## 3. Esqueleto de loader

```python
# modules/ingestion/loaders/nfse.py
"""Loader NFS-e.

Fonte: prefeitura → arquivo CSV/JSON exportado periodicamente.
Spec: docs/modules/01-ingestao.md §3.
"""

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

import polars as pl

from fiscalcheck_api.core.logging import get_logger
from fiscalcheck_api.core.security import pseudonymize

logger = get_logger(__name__)

NFSE_SCHEMA = {
    "numero_nfse": pl.Utf8,
    "data_emissao": pl.Date,
    "cnpj_prestador": pl.Utf8,
    "cnpj_tomador": pl.Utf8,
    "valor_servicos": pl.Float64,
    "iss_retido": pl.Boolean,
}


def load_nfse(file_path: Path, run_id: UUID | None = None) -> pl.DataFrame:
    """Carrega NFS-e, valida schema e pseudonimiza CNPJs.

    Idempotência: a chave natural é (numero_nfse, cnpj_prestador).
    A camada de persistência faz upsert por essa chave — chamar 2x
    com o mesmo arquivo não cria linhas novas.
    """
    rid = run_id or uuid4()
    started = datetime.now(tz=UTC)
    logger.info("nfse_load_started", run_id=str(rid), file=str(file_path))

    df = pl.read_csv(
        file_path,
        schema_overrides=NFSE_SCHEMA,
        try_parse_dates=True,
        ignore_errors=False,
    )

    expected = set(NFSE_SCHEMA.keys())
    actual = set(df.columns)
    if missing := expected - actual:
        msg = f"NFS-e: colunas obrigatórias ausentes: {sorted(missing)}"
        raise ValueError(msg)
    if extra := actual - expected:
        logger.warning(
            "nfse_extra_columns",
            run_id=str(rid),
            columns=sorted(extra),
        )

    df = df.with_columns(
        pl.col("cnpj_prestador")
        .map_elements(pseudonymize, return_dtype=pl.Utf8)
        .alias("cnpj_prestador_hash"),
        pl.col("cnpj_tomador")
        .map_elements(pseudonymize, return_dtype=pl.Utf8)
        .alias("cnpj_tomador_hash"),
    ).drop(["cnpj_prestador", "cnpj_tomador"])

    duration = (datetime.now(tz=UTC) - started).total_seconds() * 1000
    logger.info(
        "nfse_load_completed",
        run_id=str(rid),
        rows=df.height,
        duration_ms=duration,
    )
    return df
```

## 4. Upsert idempotente (persistência)

Para upsert no Postgres, **não** carregue via `df.write_database` direto — perde controle de conflito. Padrão recomendado:

1. Escrever em **staging table** com `COPY` (Polars → CSV em memória → `copy_from`).
2. `INSERT ... ON CONFLICT (chave) DO UPDATE SET ...` da staging para a tabela final.
3. `TRUNCATE` staging.

Ou usar `asyncpg.copy_records_to_table` com a chave natural única (constraint).

## 5. Streaming para arquivos grandes

```python
lf = (
    pl.scan_csv(file_path, schema_overrides=NFSE_SCHEMA)
    .filter(pl.col("valor_servicos") > 0)
    .with_columns(...)
)
df = lf.collect(streaming=True)
```

Vantagem: o arquivo não precisa caber na RAM. Necessário para NFS-e mensal de competências grandes.

## 6. Rejected rows

Linhas com schema válido mas valor inválido (CNPJ malformado, data fora de intervalo) vão para `ingestion_rejected_rows` com:

- `run_id` (link com `ingestion_runs`)
- `row_number`
- `reason` (string estável: `INVALID_CNPJ`, `DATE_OUT_OF_RANGE`)
- `payload_hash` (NÃO o payload bruto — pseudonimização)

Quem revisa rejeitados é o auditor, não o agente.

## 7. Testes obrigatórios (acionar skill `qa-test-strategist`)

- **Idempotência**: chamar `load_nfse` 2x e verificar contagem final igual.
- **Schema drift**: arquivo com coluna a mais → log de warning. Com coluna a menos → `ValueError`.
- **Pseudonimização aplicada**: payload com CNPJ `99.999.999/0001-99` → DataFrame final tem `cnpj_prestador_hash` ≠ valor original e `cnpj_prestador` não existe.
- **Streaming**: arquivo grande mockado → memória estável (não enche RAM).

## 8. Anti-padrões

- ❌ `pd.read_csv(...)` — use Polars.
- ❌ `df.write_database(..., if_table_exists="append")` em produção — sem upsert é não-idempotente.
- ❌ Logar o DataFrame inteiro (`logger.info("df", df=df.to_dicts())`) — PII vaza.
- ❌ `requests.get(...)` para baixar arquivo da fonte — use `httpx.AsyncClient`.
- ❌ Pseudonimização aplicada **depois** da persistência — viola "desde a origem".
- ❌ Schema com `pl.Object` ou `pl.Any` — fixe o tipo concreto.
- ❌ ETL que toca `audit_log` — audit é só evento, não dado de carga.
