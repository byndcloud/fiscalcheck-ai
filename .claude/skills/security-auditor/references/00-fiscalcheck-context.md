# 00 — Contexto FiscalCheck AI (leitura obrigatória)

> **Esta é a primeira referência da skill `security-auditor`.** Leia antes de `threat-modeling.md`, `access-control.md`, etc. As demais são genéricas — este arquivo as restringe e prioriza o domínio fiscal.

---

## 1. Modelo de ameaças deste produto (resumo)

O FiscalCheck AI processa **dados identificáveis de contribuintes** (CPF, CNPJ, razão social, valores declarados, NFS-e) cobertos por:

- **Sigilo fiscal** — art. 198 do CTN (Lei nº 5.172/1966). Quebra é crime, não só infração administrativa.
- **LGPD** — Lei nº 13.709/2018. Vazamento exige notificação à ANPD em **≤ 24 horas** (ver [`docs/compliance/runbook-incidente-24h.md`](../../../../docs/compliance/runbook-incidente-24h.md)).
- **Cadeia de custódia** — exigência do Edital CPSI. Toda ação com efeito sobre o contribuinte tem logs imutáveis (`auditor_id` + `correlation_id` + timestamp).

Adversários relevantes (em ordem de probabilidade):

1. **Auditor interno mal-intencionado** — escala de privilégio (de `auditor` para `supervisor`/`admin`), acesso a CPFs fora do seu escopo, manipulação de audit log.
2. **Atacante externo via web** — IDOR no painel do auditor, XSS, CSRF, vazamento via API pública (portal do cidadão).
3. **Vazamento via LLM externo** — payload com PII enviado a OpenAI/Anthropic sem pseudonimização.
4. **Vazamento via logs** — CPF/CNPJ/valor escrito em log `INFO`/`DEBUG`, exportado para SaaS de observabilidade.
5. **Comprometimento de dependência** — supply chain (npm/PyPI).

## 2. Áreas críticas — gatilho automático de revisão

Mudança em qualquer um destes paths exige **diff-review com esta skill** antes do merge:

| Caminho | Por que é crítico |
|---|---|
| [`apps/api/src/fiscalcheck_api/core/security.py`](../../../../apps/api/src/fiscalcheck_api/core/security.py) | hash de senha, JWT, **pseudonimização**. Bug aqui = vazamento sistêmico. |
| [`apps/api/src/fiscalcheck_api/core/config.py`](../../../../apps/api/src/fiscalcheck_api/core/config.py) | segredos, salt, CORS. Defaults vazando para produção = incidente. |
| [`apps/api/src/fiscalcheck_api/core/logging.py`](../../../../apps/api/src/fiscalcheck_api/core/logging.py) | cadeia de custódia. Bug aqui = perda de defensabilidade legal. |
| `apps/api/src/fiscalcheck_api/modules/compliance/**` | RBAC, MFA, audit log. Quebrar isto = quebrar o edital. |
| [`apps/api/alembic/versions/*`](../../../../apps/api/alembic/versions/) | **Migrations já aplicadas são imutáveis.** Editar um arquivo existente = vetor de adulteração de audit. Sempre uma migration NOVA. |
| `docs/compliance/**` | LGPD/sigilo formal. Mudança aqui afeta a base legal. |
| [`apps/web/lib/api-client.ts`](../../../../apps/web/lib/api-client.ts) | propagação de correlation-id; perda = quebra cadeia de custódia. |
| [`apps/web/next.config.ts`](../../../../apps/web/next.config.ts) | headers de segurança (HSTS, X-Frame-Options, Permissions-Policy). Remoção = regressão. |
| [`.replit`](../../../../.replit), [`replit.nix`](../../../../replit.nix) | superfície de exposição na hospedagem do piloto. |

## 3. Padrões de achado esperados (com alta confiança neste projeto)

Quando varrer um diff, **procure ativamente** por estes:

### 3.1 PII em logs

- ❌ `logger.info("processando contribuinte %s", cnpj)`
- ❌ `print(taxpayer)`
- ❌ `structlog.get_logger().debug("payload", data=full_request_body)`

Correção: pseudonimize antes (`pseudonymize(cnpj)`) ou log apenas o `correlation_id`.

### 3.2 PII em LLM externo sem pseudonimização

Qualquer chamada a OpenAI/Anthropic/Bedrock/etc. que contenha `cpf`, `cnpj`, `razao_social`, `nfse_numero`, valores monetários — sem `pseudonymize()` aplicado **antes** — é achado **Crítico**.

### 3.3 Endpoint que retorna dado de contribuinte sem ownership check

- ❌ `GET /casos/{id}` que faz `select Case where id=:id` sem verificar `auditor_id` do JWT e a relação `auditor → case`.
- Sempre exigir filtro por escopo do papel (módulo 6 — RBAC).

### 3.4 Audit log mutável

- ❌ `UPDATE audit_log SET ...`
- ❌ `DELETE FROM audit_log ...`
- ❌ migration que adiciona `ON UPDATE CASCADE` em audit_log
- Audit log deve ser append-only por constraint + revogação de privilégio no Postgres (no role do app).

### 3.5 Migration sobreposta

- ❌ Editar [`apps/api/alembic/versions/abc123_initial.py`](../../../../apps/api/alembic/versions/) já mergeado em `main`/`develop`.
- ✓ Criar `xyz789_fix_initial.py` com a correção.

### 3.6 Default de segredo escapando para produção

- ❌ Settings com `jwt_secret: SecretStr = SecretStr("change-me-...")` sem validator que falhe em `staging`/`production`.
- ❌ `.env.example` com valor que parece real (não-placeholder).

### 3.7 CORS frouxo

- ❌ `allow_origins=["*"]` ou wildcard.
- ✓ Lista explícita em `CORS_ALLOW_ORIGINS` env var (ver [`config.py`](../../../../apps/api/src/fiscalcheck_api/core/config.py)).
- ❌ `allow_credentials=True` combinado com origem wildcard.

### 3.8 RBAC bypass

Papéis definidos em [`AGENTS.md` §1.3](../../../../AGENTS.md):

- `auditor`, `supervisor`, `admin`, `cidadao`, `agente_sistema`.

Procure por:

- Endpoint sem dependency de autenticação (FastAPI `Depends(get_current_user)`).
- Endpoint que só checa "tem token", não "tem papel X".
- Privilégio implícito de `admin` que o `auditor` consegue invocar por path traversal de rota.
- `cidadao` (portal de autorregularização) acessando endpoint de `auditor`.

### 3.9 MFA não exigido para papéis privilegiados

`auditor`, `supervisor`, `admin` exigem MFA ([`AGENTS.md` §1.3](../../../../AGENTS.md)).

- ❌ Fluxo de login que retorna JWT sem checar `mfa_verified=true` no token.
- ✓ JWT com claim `mfa_at` exigida pelo endpoint para esses papéis.

### 3.10 Headers de segurança no frontend

Verificar que [`apps/web/next.config.ts`](../../../../apps/web/next.config.ts) mantém:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

Remoção de qualquer um = regressão de segurança = achado **Médio** no mínimo.

## 4. Severidade — calibragem FiscalCheck

A escala genérica em `references/reporting.md` aplica, mas no domínio fiscal:

- **Crítica** — qualquer vazamento confirmado de CPF/CNPJ/valor; bypass de RBAC permitindo `auditor` A ver dados de competência do `auditor` B; PII enviada a LLM externo sem pseudonimização; audit log mutável; auth bypass.
- **Alta** — escalonamento de privilégio (auditor → supervisor); SQL injection mesmo sem PoC de exfiltração; XSS persistente no painel do auditor; remoção de header de segurança; secret real commitado.
- **Média** — XSS refletido; CSRF; SSRF limitado; CORS frouxo; falha em logging estruturado (sem PII vazando, mas auditoria fica cega).
- **Baixa** — falhas de hardening; mensagem de erro com path interno; verbose 500.

Veja também [`SECURITY.md` "Classificação de severidade"](../../../../SECURITY.md) para os SLAs de correção.

## 5. Fluxo recomendado neste repositório

1. **Scope** — diff-only por padrão; widen se a mudança tocar paths críticos do §2 acima.
2. **Pre-pass** — `bash .claude/skills/security-auditor/scripts/triage.sh --diff origin/develop` para uma varredura barata.
3. **Threat-model** rápido — qual papel ataca o quê, em qual módulo (1–7).
4. **Read along risk axes** — para FiscalCheck, comece sempre por `access-control.md` + `secrets-and-data.md`.
5. **Findings** — sempre com **módulo afetado** (1–7) e **impacto LGPD/sigilo** explícito.
6. **Filter** — descarte achados em fixtures de teste (mas **não** em código de produção que processa fixture).
7. **Report** — usar formato do `reporting.md`, acrescentando o campo "Módulo:" antes de "Where:".

## 6. Coisas a NÃO reportar (filtro FP específico do projeto)

- `change-me-...` em `.env.example` ou em defaults do `Settings` **enquanto** houver validator no `Settings` que falhe em prod (ver tarefa `settings_validator` desta sprint).
- Uso de `random.random()` em testes — não é cripto.
- `Math.random()` em IDs de UI no frontend (não-segurança).
- `eval` ou `exec` em scripts de skill (`.claude/skills/`) — não rodam em produção.
- Tokens em fixtures pseudonimizadas — são placeholders.

## 7. Coisas a SEMPRE reportar mesmo se "parecem inofensivas"

- Qualquer `print()` ou `console.log()` em código que toca dado de contribuinte.
- Qualquer query com `f"... WHERE id={var}"` ou template literal com SQL.
- Qualquer endpoint novo sem `Depends(get_current_user)` (ou equivalente) **se** retornar dado de contribuinte.
- Adição de dependência transitiva inesperada num PR não-deps (supply chain).
- Mudança em `apps/api/src/fiscalcheck_api/modules/compliance/**` sem ADR linkado.

## 8. Formato de achado (extensão FiscalCheck)

Adicione duas linhas ao formato em `references/reporting.md`:

```
### [Crítica] Título — apps/api/src/.../router.py:42

**Módulo afetado**: 4 (Gestão da Fiscalização)
**Impacto LGPD/sigilo**: vazamento de CPF do contribuinte para todos os auditores logados.

**Where**:  ...
**What**:   ...
**Attack**: ...
**Fix**:    ...
**Confidence**: high
**Refs**: OWASP A01:2025; art. 198 CTN; LGPD art. 46.
```
