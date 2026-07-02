# 00 — Contexto FiscalCheck AI (leitura obrigatória)

> **Esta é a primeira referência da skill `qa-test-strategist`.** Leia antes de `strategy.md`, `unit-tests.md`, etc. As demais são genéricas — este arquivo as restringe ao projeto.

---

## 1. Regras não-negociáveis do projeto

Conforme [`AGENTS.md` §5](../../../../AGENTS.md):

- **Toda regra fiscal nova exige teste.** Não há "vou fazer o teste no próximo PR".
- **Cruzamentos (módulo 2)** e **score de risco (módulo 3)** exigem **golden tests** com casos sintéticos auditáveis (entrada → saída esperada versionadas no repo).
- **Não usar dados reais de contribuintes em testes.** Sempre fixtures pseudonimizadas em [`apps/api/tests/fixtures/`](../../../../apps/api/tests/fixtures/).
- **Audit logs (módulo 6)** são append-only — qualquer teste que toque essa camada deve verificar a propriedade de imutabilidade (UPDATE/DELETE devem falhar).

## 2. Stacks de teste

| Stack | Framework | Onde | Como rodar |
|---|---|---|---|
| Frontend | **Vitest** + `@testing-library/react` + `jsdom` | [`apps/web/tests/`](../../../../apps/web/tests/) (config em [`vitest.config.ts`](../../../../apps/web/vitest.config.ts)) | `pnpm --filter @fiscalcheck/web test` ou `pnpm test` |
| Backend | **pytest** + `pytest-asyncio` (modo `auto`) + `httpx.AsyncClient` | [`apps/api/tests/`](../../../../apps/api/tests/) (config em [`pyproject.toml`](../../../../apps/api/pyproject.toml) `[tool.pytest.ini_options]`) | `uv run pytest -q` no `apps/api/` ou `pnpm --filter @fiscalcheck/api test` |
| Lint estático | Biome (web), Ruff + Pyright (api) | — | `pnpm lint && pnpm typecheck` |

Marcadores pytest disponíveis:

- `@pytest.mark.slow` — testes lentos. CI roda por padrão; desenvolvedor pode excluir com `uv run pytest -m "not slow"`.
- `@pytest.mark.integration` — testes que tocam serviços externos (DB real, Redis real). **Não** rodam no CI padrão; precisam de DB pgvector levantado.

## 3. Onde os testes vivem

```
apps/api/tests/
├── conftest.py                # fixtures globais (app, AsyncClient)
├── test_smoke.py              # health, correlation-id, pseudonimização
├── fixtures/                  # CSVs/JSONs sintéticos e PSEUDONIMIZADOS
└── <modulo>/                  # crossing/, ai/, cases/, …
    ├── test_<funcionalidade>.py
    └── golden/                # entradas e saídas esperadas (json)
```

```
apps/web/tests/
├── setup.ts                   # jsdom matchers
└── <feature>.test.ts(x)
```

## 4. Padrões obrigatórios por módulo

### Módulo 1 — Ingestão (Polars ETL)

- Teste de **idempotência**: rodar a mesma carga duas vezes deve produzir o mesmo estado final, sem duplicar linhas.
- Teste de **schema drift**: payload com coluna a mais / a menos é tratado (warn ou fail explícito), não silenciosamente ignorado.
- Teste de **pseudonimização aplicada** antes da persistência: CPF/CNPJ no input ≠ valor armazenado.

### Módulo 2 — Cruzamento (declarado × NFS-e)

- **Golden tests**: cada regra de cruzamento tem ≥3 casos: (a) tudo casa, (b) divergência clara, (c) caso de borda (zerado, retificação, NFS-e cancelada).
- Atualizar o golden requer atualização explícita do arquivo de referência no PR — não automático.
- Para o grafo no MVP (NetworkX in-memory — ver [`ADR-0002`](../../../../docs/adr/0002-database-mvp-replit.md)), testar propriedades determinísticas (ex.: "sócios em comum entre N entidades retorna o mesmo conjunto independentemente da ordem").

### Módulo 3 — Score de risco / IA

- **Golden tests** com fixture sintética: feature → score esperado (intervalo, não valor exato — modelo evolui).
- **Eval LLM** para o Copilot (módulo 7) e qualquer prompt que envolva LLM externo: dataset curado em [`apps/api/tests/fixtures/evals/`](../../../../apps/api/tests/fixtures/evals/) (a criar quando o módulo for codificado), seguindo `references/ai-evals.md`.
- **Pseudonimização antes do envio a LLM externo** é teste de não-vazamento: o request capturado por um mock não pode conter CPF/CNPJ.

### Módulo 4 — Gestão da fiscalização

- Teste de **state machine**: transições válidas/inválidas. Ação humana sempre requer `auditor_id` (ver `human-in-the-loop` em [`AGENTS.md` §1.1](../../../../AGENTS.md)).
- Teste de **notificação multicanal**: mock de provider; verificar que o payload **não** contém PII além do estritamente necessário.

### Módulo 6 — Compliance

- Audit log é append-only — teste deve provar que `UPDATE`/`DELETE` falham (constraint ou trigger).
- Teste de **retenção**: registros mais antigos que `AUDIT_LOG_RETENTION_DAYS` são removidos por job; mais novos permanecem.
- RBAC: para cada papel (`auditor`, `supervisor`, `admin`, `cidadao`, `agente_sistema`), pelo menos um teste de "X pode acessar Y" e um de "X **não** pode acessar Z".

## 5. O que já existe (use como referência de estilo)

[`apps/api/tests/test_smoke.py`](../../../../apps/api/tests/test_smoke.py):

- `test_health_endpoint` — verifica que `/health` responde 200 com `status`/`version`.
- `test_correlation_id_propagated` — header de entrada é refletido na resposta.
- `test_correlation_id_generated` — sem header, o middleware gera um UUID.
- `test_pseudonymize_is_deterministic` / `test_pseudonymize_diverges_for_different_values` — propriedades da pseudonimização (HMAC-SHA256 + salt).

Use o estilo desses testes (`AsyncClient` injetado por fixture, `@pytest.mark.asyncio` apenas onde necessário já que `asyncio_mode = "auto"`).

## 6. Fixtures pseudonimizadas

Convenção quando criar fixtures novas em `apps/api/tests/fixtures/`:

- **Nomes**: nunca usar nomes reais; gere com `Faker(locale="pt_BR")` e fixe a seed (`Faker.seed(42)`).
- **CPF/CNPJ**: gere válidos (com dígitos verificadores corretos) — biblioteca `validate-docbr` ou gerador próprio — para que valide os ramos de validação. Não use sequências (`111.111.111-11`) que falham na validação.
- **Valores monetários**: distribuição plausível (lognormal entre R$ 100 e R$ 1M para NFS-e), não múltiplos de 1000.
- **Documente a fixture** em um `README.md` na subpasta explicando o que ela representa.

## 7. Anti-padrões específicos do FiscalCheck

- ❌ Teste que mocka `pseudonymize` para retornar o valor original — perde o propósito.
- ❌ Golden test sem versionamento explícito do golden no Git (não pode regenerar silenciosamente em CI).
- ❌ Teste de regra fiscal sem citar **fonte legal** (qual artigo / inciso) num comentário ou docstring.
- ❌ E2E completo no fluxo de intimação sem `auditor_id` (testaria human-in-the-loop como opcional, o que ele não é).
- ❌ Coverage como meta — 100% com asserts `expect(x).toBeDefined()` é pior que 60% com asserts que protegem comportamento fiscal.
- ❌ Dados reais de Brusque/SC em fixture, mesmo "só uma vez para testar". Use Faker.

## 8. Relatório do plano (extensão FiscalCheck)

Quando emitir o "Test plan validation report" (Phase 6 do `SKILL.md`), adicione duas linhas FiscalCheck na nota dos itens aplicáveis:

- **Módulo afetado** (1–7) — para rastreabilidade.
- **Impacto LGPD/sigilo** — se a feature toca dado de contribuinte, descreva como o teste cobre pseudonimização e/ou ausência de PII em logs/payloads de erro.
