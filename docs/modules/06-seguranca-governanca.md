# Módulo 6 — Segurança, Governança e Conformidade

> Atuação **transversal** a todos os módulos. Sem ele, a plataforma é juridicamente indefensável.
> Pasta: `apps/api/src/fiscalcheck_api/modules/compliance/`.

## Objetivo (do edital)

> Proteger o dado fiscal, garantir rastreabilidade e aderência à LGPD e ao sigilo fiscal (art. 198 do CTN).

## Funcionalidades-chave

- **Agente Guardrail** — RBAC, sigilo fiscal, logs imutáveis, acessos atípicos, bloqueio de uso indevido.
- **Proteção de Dados** — TLS 1.2+ em trânsito, AES-256 em repouso, MFA obrigatório.
- **Cadeia de Custódia** — logs imutáveis (append-only) com autoria, aprovação/rejeição e timestamp. No protótipo web, a imutabilidade é **demonstrável** na tela `/compliance/trilha`: hash encadeado sobre os campos imutáveis de cada evento (`apps/web/lib/compliance/audit-chain.ts`) exposto pelo card de integridade (TR 5.4.9) — alterar ou remover evento passado muda o hash da cadeia. Mock usa FNV-1a; produção prevê SHA-256 com âncora externa.
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

## Entrega T20 · Ambiente de Simulação e Capacitação (RSC04)

Modo "Treinamento" no front-end (`apps/web/app/(dashboard)/treinamento/`), acessível por item próprio na sidebar (seção "Capacitação", papéis auditoriais):

- **Separação do ambiente real**: rota, handlers MSW (`/training/*`) e estado in-memory exclusivos — nenhuma tentativa gera caso, notificação ou entrada de auditoria; faixa âmbar permanente "AMBIENTE DE TREINAMENTO · dados anonimizados".
- **Anonimização**: contribuintes por codinome ("Contribuinte Alfa"…) e CNPJ mascarado (`**.***.***/0001-**`), valores alterados — verificado por teste automatizado.
- **Biblioteca de casos-exercício com gabarito**: 6 exercícios (iniciante → avançado) cobrindo os 5 tipos de divergência + falsos positivos didáticos. O auditor em formação decide (`aprovar|ajustar|rejeitar`) e justifica (≥ 20 chars); só então vê o comparativo **"sua decisão × decisão histórica"**, o desfecho real do caso e o aprendizado.
- **Sigilo do gabarito**: `GET /training/cases` nunca inclui o gabarito antes da tentativa; segunda tentativa é bloqueada (409) porque o gabarito já foi revelado.

## Decisões pendentes

- Provedor de identidade: **gov.br** (federado, ideal) vs **Keycloak self-hosted** vs **Azure AD do município**?
- **MFA**: TOTP (Authy/Google Authenticator) sempre suportado; WebAuthn como segundo fator opcional.
- **Cifra em repouso**: confiar no banco gerenciado (AWS RDS) ou aplicar AES-GCM em colunas sensíveis específicas?
- **Detecção de acessos atípicos**: regras heurísticas ou ML (Isolation Forest)?
