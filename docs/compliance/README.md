# Conformidade — FiscalCheck AI

Resumo consolidado de aderência a **LGPD (Lei nº 13.709/2018)** e **sigilo fiscal (art. 198 do CTN — Lei nº 5.172/1966)** para a fase de MVP.

> Este documento substitui, na fase de MVP, os documentos detalhados (LGPD completa, sigilo fiscal, política de retenção, templates de RIPD/ROPA e runbook de incidente). Os documentos completos serão reintroduzidos quando o produto sair do piloto e passar a tratar dados reais de contribuintes em produção — eles permanecem disponíveis no histórico do git.

---

## Papéis LGPD

| Papel | Quem é |
| --- | --- |
| **Titular** | Cidadão / contribuinte |
| **Controlador** | Município de Brusque / Secretaria Municipal da Fazenda |
| **Operador** | Beyond / Aurora (fornecedor da solução) |
| **Encarregado (DPO)** | A definir pelo controlador |

**Base legal do tratamento:** execução de políticas públicas (art. 7º, III) e cumprimento de obrigação legal (art. 7º, II).

## Princípios não-negociáveis

1. **Minimização** — tratar apenas o dado necessário ao fim fiscal (LGPD art. 6º, III).
2. **Pseudonimização desde a origem** — aplicada **antes** de qualquer treinamento de modelo ou envio a LLM externo. Implementação: `pseudonymize()` em `apps/api/src/fiscalcheck_api/core/security.py` (HMAC-SHA256 com salt).
3. **Sigilo fiscal (art. 198 CTN)** — dado fiscal identificável (CPF, CNPJ, razão social, valores) só é acessado por servidor autorizado, no estrito interesse da Administração Tributária. Vazamento é crime (art. 325 do CP).
4. **Cadeia de custódia** — logs de auditoria imutáveis (append-only) com `actor_id` + `correlation_id` + timestamp. Sem `UPDATE`/`DELETE` em tabelas de auditoria.
5. **Human-in-the-loop** — decisões com efeito sobre o contribuinte sempre têm aprovação humana registrada (art. 20 LGPD atendido por construção).
6. **Localização nacional em produção** — dados reais exigem hospedagem em território brasileiro (AWS São Paulo, Azure Brazil South ou nuvem TCE-SC). O Replit é aceitável **apenas para o piloto**, com dados sintéticos ou pseudonimizados.

## Onde o dado identificável pode (e não pode) estar

| Local | Dado em claro? |
| --- | --- |
| Banco de produção | Sim (o auditor precisa operar) |
| Logs estruturados (qualquer nível) | **Não** — sempre pseudonimizado |
| LLM externo (OpenAI, Anthropic) | **Não** — pseudonimizar antes do envio |
| Datasets de treinamento | **Não** — pseudonimizado obrigatoriamente |
| Ambientes de dev / staging / testes | **Não** — somente dados sintéticos (fixtures em `apps/api/tests/fixtures/`) |

## Retenção (resumo)

- **Padrão fiscal: 5 anos** (CTN art. 173/174) para NFS-e, declarações, casos regularizados e audit log — configurado via `AUDIT_LOG_RETENTION_DAYS=1825`.
- Logs de aplicação (info/debug): 90 dias com rotação automática.
- Eliminação após o prazo é **segura e auditável** (soft-delete + purge; backups cifrados com rotação de 12 meses).
- Pedido de eliminação pelo titular (art. 18, VI): dado fiscal sob retenção legal do CTN **não pode** ser eliminado antes do prazo — justificar ao titular; dado excedente pode ser eliminado de imediato.

## Incidentes

Resposta em até **24 horas** após confirmação, com comunicação à ANPD e ao titular conforme art. 48 da LGPD. O runbook operacional detalhado será formalizado antes do go-live com dados reais.

## Checklist antes de tocar em dado identificável

1. Esta operação é **necessária** para o fim fiscal?
2. O dado está **pseudonimizado** onde possível?
3. O acesso está **registrado** no audit log?
4. Há **base legal** explícita?
5. A **retenção** prevista respeita o prazo do CTN?
