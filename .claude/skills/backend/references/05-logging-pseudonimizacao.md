# 05 — Logging estruturado e pseudonimização

> Arquivos de referência: [`core/logging.py`](../../../../apps/api/src/fiscalcheck_api/core/logging.py), [`core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py).

A cadeia de custódia exigida pelo edital depende destes dois itens funcionarem juntos.

---

## 1. Logger por módulo

```python
from fiscalcheck_api.core.logging import get_logger

logger = get_logger(__name__)
```

**Sempre** com `__name__` — o processor `add_logger_name` do structlog usa essa string para identificar a origem do log.

## 2. Eventos estruturados (não mensagens)

Errado:

```python
logger.info(f"Auditor {auditor_id} criou o caso {case_id} com risco {score}")
```

Certo:

```python
logger.info(
    "case_created",
    auditor_id=str(auditor_id),
    case_id=str(case_id),
    risk_score=score,
)
```

Razão: o JSON estruturado permite filtrar/agregar em SRE tools. O nome do evento (`case_created`) é estável; os campos são tipados.

**Convenção de nomes de evento**:

- `module_action` ou `domain_action`. Ex.: `nfse_load_started`, `case_created`, `triage_decision_received`.
- Em inglês, snake_case (ver [`AGENTS.md` §1.4](../../../../AGENTS.md): "Mensagens de log estruturado: inglês").

## 3. Níveis

| Nível | Quando |
|---|---|
| `DEBUG` | Investigação fina em dev. **Nunca** dado de contribuinte. |
| `INFO` | Eventos esperados: requisição recebida, job iniciado, agente avançou de node. |
| `WARNING` | Algo anormal mas tratado: schema drift, retry, rate-limit. |
| `ERROR` | Falha que afeta a requisição/job; geralmente vira HTTP 5xx. Inclua `exc_info` se houver exceção. |
| `CRITICAL` | Sistema inoperante (DB caiu, segredo placeholder em prod). |

Padrão em prod: `INFO`. Em dev pode-se reduzir para `DEBUG`.

## 4. Correlation ID

O middleware [`CorrelationIdMiddleware`](../../../../apps/api/src/fiscalcheck_api/core/logging.py) já propaga `X-Correlation-Id`:

- Lê do header da requisição (se válido, ≤ 128 chars).
- Gera UUIDv4 senão.
- Coloca em `request.state.correlation_id`.
- Coloca em `contextvars` (acessível em qualquer logger no ciclo da requisição).
- Devolve em `X-Correlation-Id` da resposta.

O processor `_add_correlation_id` injeta automaticamente em cada log dentro do escopo da requisição. **Não passe manualmente** — confie no contextvar.

Para jobs fora de requisição (ETL agendado, agente assíncrono):

```python
import uuid

from fiscalcheck_api.core.logging import _correlation_id_var  # contextvar interno
from fiscalcheck_api.core.logging import get_logger

logger = get_logger(__name__)

def run_etl_job() -> None:
    correlation_id = str(uuid.uuid4())
    token = _correlation_id_var.set(correlation_id)
    try:
        logger.info("etl_job_started")
        # ... trabalho ...
        logger.info("etl_job_completed")
    finally:
        _correlation_id_var.reset(token)
```

> Quando o módulo 1 (ingestão) formalizar, podemos extrair um helper `with_correlation_id(...)`. Por enquanto, esse padrão.

## 5. Pseudonimização (`pseudonymize()`)

[`core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py):

```python
def pseudonymize(value: str) -> str:
    """Hash determinístico com salt (HMAC-SHA256).

    Aplicado a CPF/CNPJ antes de qualquer envio a LLMs externos e
    antes do treinamento de modelos (requisito LGPD).
    """
```

Propriedades garantidas:

- **Determinístico** — mesma entrada + mesmo salt = mesmo hash. Permite join entre tabelas anônimas.
- **Não-reversível** — sem o salt (`PSEUDONYMIZATION_SALT`), reverter exige força bruta inviável.
- **Distinto por entrada** — colisão ~ 2⁻²⁵⁶.

Use **antes** de:

1. Enviar payload a LLM externo (OpenAI, Anthropic, …).
2. Treinar/avaliar modelo ML.
3. Exportar dataset para fora do produto.
4. Logar identificador para correlação cross-tabela (mantendo PII fora do log).

Não use para:

- Senhas (use `hash_password`, bcrypt).
- Tokens de sessão (use JWT).
- Onde precisa apresentar o valor original ao auditor — pseudonimização é unidirecional.

## 6. Padrão de log para acesso a dado de contribuinte

```python
logger.info(
    "taxpayer_accessed",
    taxpayer_hash=pseudonymize(taxpayer_id),   # NÃO o CPF/CNPJ
    auditor_id=str(auditor_id),
    purpose="case_review",                      # base legal LGPD
)
```

Esse evento é o que prova, em auditoria, que o auditor X acessou o contribuinte Y, com correlação por `correlation_id`, sem expor PII no log.

## 7. Mensagens de erro vs. logs

Resposta HTTP de erro (pt-BR, sem stack trace):

```python
raise HTTPException(
    status_code=422,
    detail={"error_code": "INVALID_CNPJ", "message": "CNPJ inválido."},
)
```

Log estruturado (inglês, com contexto técnico):

```python
logger.error(
    "validation_failed",
    field="cnpj_prestador",
    error_code="INVALID_CNPJ",
    exc_info=True,
)
```

Cliente vê a mensagem; SRE vê o contexto. PII fica em nenhum dos dois.

## 8. PII permitida em log estruturado

| Campo | Pode logar? | Como |
|---|---|---|
| `auditor_id` (UUID) | Sim | Identificador interno, sem PII. |
| `case_id` (UUID) | Sim | Identificador interno. |
| `taxpayer_id` (UUID interno) | Sim | É um ID nosso, não o CPF. |
| `taxpayer_hash` (hash do CPF) | Sim | Hash via `pseudonymize`. |
| `cpf`, `cnpj`, `nome`, `razao_social` | **Não** | PII direta. |
| `valor_servicos`, `valor_iss` | Pense duas vezes | Em INFO: agregue (faixa, ordem de grandeza). Em DEBUG nunca. |
| `numero_nfse` | Caso a caso | Não é PII isolado, mas combinado com `cnpj_prestador` identifica. Prefira o hash. |
| Mensagens de prompt/LLM | **Não** | Podem conter PII inadvertida; logue só meta (tokens, modelo, latência). |

## 9. Anti-padrões

- ❌ `print(...)` em qualquer lugar — Ruff já reclama.
- ❌ `logger.info(payload)` onde `payload` é o body bruto da requisição.
- ❌ `f"erro processando {cpf}"` no log.
- ❌ `exc_info=True` em log de validação (sobrecarrega; use só em erros inesperados).
- ❌ Encadear `pseudonymize(pseudonymize(x))` — destrói a propriedade determinística.
- ❌ Não testar a determinístcia — quebrar acidentalmente (mudar o `value.encode()` para `value.encode("latin-1")`) silencia a propriedade.
- ❌ Logar `correlation_id=None` — significa que você está fora do escopo do middleware; injete manualmente via contextvar.
