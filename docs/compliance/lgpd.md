# LGPD aplicada ao FiscalCheck AI

> Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais.
>
> Este documento descreve **como** o FiscalCheck AI implementa cada princípio da LGPD. Não substitui a opinião jurídica do encarregado (DPO) da Beyond/Aurora nem do município contratante.

## Papéis

| Papel LGPD | Quem é no FiscalCheck AI |
| --- | --- |
| **Titular** | Cidadão / contribuinte (e auditor, na medida de seus dados pessoais) |
| **Controlador** | Município de Brusque / Secretaria Municipal da Fazenda |
| **Operador** | Beyond / Aurora (fornecedor da solução) |
| **Encarregado (DPO)** | A definir pelo controlador (município) |

## Princípios e implementação

| Princípio (art. 6º) | Como implementamos |
| --- | --- |
| Finalidade | Tratamento exclusivo para a triagem fiscal e suporte à arrecadação. Não há uso secundário (marketing, perfilamento comercial, etc.). |
| Adequação | Cada módulo trata apenas dados pertinentes à sua função; `modules/compliance/parameters/` define escopo. |
| Necessidade | Mínima coleta possível; campos não necessários ao indício não são copiados das fontes. |
| Livre acesso | Portal do cidadão (módulo 4) permite ao titular consultar dados sobre si. |
| Qualidade dos dados | Validação no módulo 1 + agente de qualidade 24/7. |
| Transparência | Comunicações ao cidadão em **pt-BR claro**, explicando indício e valores. |
| Segurança | TLS 1.2+, AES-256 em repouso, RBAC, MFA, audit logs imutáveis. |
| Prevenção | Pseudonimização antes de ML/LLM; agente Guardrail bloqueia uso indevido. |
| Não discriminação | Score de risco com explicabilidade; sem viés étnico/social (auditoria periódica). |
| Responsabilização | Cadeia de custódia auditável (módulo 6); RIPD + ROPA mantidos. |

## Base legal

Tratamento amparado em **execução de políticas públicas** (art. 7º, III) e **cumprimento de obrigação legal** (art. 7º, II): o município é obrigado a fiscalizar a arrecadação tributária.

## Direitos do titular

Operacionalizados pelo portal do cidadão (módulo 4) e canal do DPO:

- Confirmação da existência de tratamento (art. 18, I)
- Acesso aos dados (art. 18, II)
- Correção de dados incompletos/inexatos (art. 18, III)
- Anonimização/bloqueio/eliminação de dados desnecessários (art. 18, IV)
- Portabilidade (art. 18, V) — exportação em formato estruturado (CSV/JSON)
- Eliminação de dados (art. 18, VI) — respeitada a retenção legal mínima
- Informação sobre compartilhamentos (art. 18, VII)
- Revisão de decisões automatizadas (art. 20) — sempre disponível, dado o human-in-the-loop

## Operações de tratamento

Registradas no [`ropa-template.md`](./ropa-template.md). Toda nova operação requer atualização do ROPA + revisão do DPO.

## Avaliação de impacto (RIPD)

Modelo em [`ripd-template.md`](./ripd-template.md). RIPD obrigatório para tratamento que envolva risco elevado — dado fiscal em massa **é** alto risco.

## Retenção

Detalhada em [`politica-retencao.md`](./politica-retencao.md). Padrão para `audit_log`: **5 anos** (1825 dias) por força do art. 173 do CTN e LGPD art. 16.

## Incidentes

Resposta em até **24 horas** após confirmação. Runbook em [`runbook-incidente-24h.md`](./runbook-incidente-24h.md). Comunicação à ANPD e ao titular conforme art. 48.

## Pseudonimização (implementação técnica)

Aplicada em `apps/api/src/fiscalcheck_api/core/security.py`:

```python
from fiscalcheck_api.core.security import pseudonymize

cpf_hash = pseudonymize("12345678900")  # HMAC-SHA256 com salt do .env
```

**Onde é obrigatória:**

- Antes de envio a LLM externo (OpenAI, Anthropic).
- Antes de uso em datasets de treinamento.
- Em logs estruturados (sempre).
- No ambiente de simulação (módulo 7).

**Onde NÃO se aplica** (necessidade operacional):

- Banco operacional do auditor (auditor precisa ver o CPF/CNPJ para conduzir o caso).
- Notificações ao cidadão (precisam de e-mail/SMS reais).

## Localização

Dados de produção em **território brasileiro** (AWS São Paulo / Azure Brazil South / nuvem TCE-SC). Replit é aceitável apenas para piloto com dados sintéticos ou pseudonimizados.

## Auditoria periódica

A cada 6 meses (mínimo), realizar:

- Revisão do ROPA.
- Verificação de logs de acesso (detectar acessos atípicos).
- Revisão de papéis e permissões (princípio do menor privilégio).
- Atualização do RIPD se houve mudança de escopo.
