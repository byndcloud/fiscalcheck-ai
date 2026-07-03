# Módulo 6 — Segurança, Governança e Conformidade

> Atuação **transversal** a todos os módulos. Sem ele, a plataforma é juridicamente indefensável.
> Pasta: `apps/api/src/fiscalcheck_api/modules/compliance/`.

## Objetivo (do edital)

> Proteger o dado fiscal, garantir rastreabilidade e aderência à LGPD e ao sigilo fiscal (art. 198 do CTN).

## Funcionalidades-chave

- **Agente Guardrail** — RBAC, sigilo fiscal, logs imutáveis, acessos atípicos, bloqueio de uso indevido.
- **Proteção de Dados** — TLS 1.2+ em trânsito, AES-256 em repouso, MFA obrigatório.
- **Cadeia de Custódia** — logs imutáveis (append-only) com autoria, aprovação/rejeição e timestamp.
- **Conformidade LGPD** — pseudonimização, apoio a RIPD, política de retenção, resposta a incidente ≤ 24h, preferência por localização nacional.

## Arquitetura interna

```text
modules/compliance/
├── router.py
├── service.py
├── schemas.py
├── models.py
├── repository.py
├── rbac/                # políticas e dependências FastAPI (require_role)
│   ├── roles.py
│   ├── policies.py
│   └── decorators.py
├── audit/               # audit log append-only
│   ├── models.py        # tabela audit_log
│   ├── service.py
│   └── append_only_trigger.sql
├── mfa/                 # TOTP, WebAuthn
├── pseudonymization/    # delega para core/security.py
└── parameters/          # parâmetros configuráveis pela Secretaria
    └── service.py
```

## Atalhos para outros módulos

Todo módulo importa daqui:

```python
from fiscalcheck_api.modules.compliance.rbac import require_role
from fiscalcheck_api.modules.compliance.audit import audit_action
from fiscalcheck_api.modules.compliance.parameters import get_param

@router.post("/cases/{id}/decide")
async def decidir(
    id: UUID,
    auditor: Auditor = Depends(require_role("auditor")),
):
    ...
    await audit_action(
        action="case.decide",
        actor_id=auditor.id,
        payload={"case_id": id},
    )
```

## Dependências entre módulos

- **Entrada:** TODOS os módulos passam por ele (auth, audit, parâmetros).
- **Saída:** nenhuma para o usuário final diretamente — é infraestrutura.

## Métricas / SLA

- **100%** das ações com efeito sobre contribuinte com `auditor_id` + `correlation_id` no audit log.
- **Resposta a incidente** ≤ 24h após confirmação (ver [`../compliance/README.md`](../compliance/README.md)).
- **0** entradas mutáveis em `audit_log` (verificado por trigger).
- **MFA**: 100% dos auditores ativos com MFA habilitado.

## Decisões pendentes

- Provedor de identidade: **gov.br** (federado, ideal) vs **Keycloak self-hosted** vs **Azure AD do município**?
- **MFA**: TOTP (Authy/Google Authenticator) sempre suportado; WebAuthn como segundo fator opcional.
- **Cifra em repouso**: confiar no banco gerenciado (AWS RDS) ou aplicar AES-GCM em colunas sensíveis específicas?
- **Detecção de acessos atípicos**: regras heurísticas ou ML (Isolation Forest)?
