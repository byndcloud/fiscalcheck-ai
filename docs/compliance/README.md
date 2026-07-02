# Conformidade — FiscalCheck AI

Documentos de aderência a **LGPD (Lei nº 13.709/2018)** e **sigilo fiscal (art. 198 do CTN — Lei nº 5.172/1966)**.

## Documentos

| Doc | Finalidade |
| --- | --- |
| [`lgpd.md`](./lgpd.md) | Visão geral LGPD aplicada ao projeto |
| [`sigilo-fiscal-art-198-ctn.md`](./sigilo-fiscal-art-198-ctn.md) | Regras do sigilo fiscal incidentes |
| [`ripd-template.md`](./ripd-template.md) | Template de Relatório de Impacto à Proteção de Dados |
| [`ropa-template.md`](./ropa-template.md) | Template de Registro de Operações de Tratamento |
| [`politica-retencao.md`](./politica-retencao.md) | Política de retenção e eliminação segura |
| [`runbook-incidente-24h.md`](./runbook-incidente-24h.md) | Runbook de resposta a incidente (SLA ≤ 24h) |

## Princípios fundamentais

- **Minimização**: trate apenas o dado necessário ao fim fiscal.
- **Pseudonimização desde a origem**: aplicada **antes** de qualquer treinamento de modelo ou envio a LLM externo.
- **Localização nacional**: preferência por hospedagem em território brasileiro (AWS São Paulo, Azure Brazil South, nuvem TCE-SC).
- **Cadeia de custódia**: logs imutáveis (append-only) com `auditor_id` + `correlation_id` + timestamp.
- **Sigilo fiscal**: o dado fiscal só pode ser acessado por servidor autorizado, no estrito interesse da Administração Tributária.

## Quem revisa

Mudanças aqui exigem revisão da skill `security-auditor` (ver [`CODEOWNERS`](../../.github/CODEOWNERS)).

## Lembrete operacional

Antes de qualquer mudança que toque dado identificável, pergunte:

1. Esta operação é **necessária** para o fim fiscal? (LGPD art. 6º, III)
2. O dado está **pseudonimizado** onde possível?
3. O acesso está **registrado** no audit log?
4. Há **base legal** explícita?
5. A **retenção** prevista respeita a política?
