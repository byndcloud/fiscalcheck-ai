# ROPA — Registro de Operações de Tratamento de Dados

> Inventário vivo de operações de tratamento (LGPD art. 37). Deve ser atualizado a cada nova operação ou mudança material.
>
> Sugere-se manter como tabela única abaixo, com uma linha por operação.

## Identificação geral

- **Controlador:** Município de Brusque / Secretaria Municipal da Fazenda
- **Operador:** Beyond / Aurora
- **Encarregado (DPO) do controlador:** A definir
- **Encarregado (DPO) do operador:** A definir
- **Versão deste ROPA:** 1.0 — AAAA-MM-DD

## Operações de tratamento

| # | Operação | Módulo | Finalidade | Categorias de dados | Categorias de titulares | Base legal | Compartilhamento | Retenção | Transferência internacional | Medidas de segurança |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ingestão de NFS-e | 1 | Triagem fiscal | Identificação, econômico | Contribuintes | Art. 7º, II | Não | 5 anos (art. 173 CTN) | Não | RBAC, audit log, TLS, AES-256 |
| 2 | Cruzamento declarado x NFS-e | 2 | Detecção de inconsistência | Identificação, econômico | Contribuintes | Art. 7º, II/III | Não | Idem | Não | Idem + pseudonimização em ML |
| 3 | Score de risco preditivo | 3 | Priorização do trabalho fiscal | Econômico, comportamental | Contribuintes | Art. 7º, III | Não | Idem | Não | Idem + explicabilidade + human-in-the-loop |
| 4 | Notificação ao cidadão | 4 | Comunicação de divergência / autorregularização | Identificação, contato | Contribuintes | Art. 7º, II/III | Provedor de e-mail/SMS/WhatsApp (operador) | Idem | A confirmar pelo provedor | TLS, contrato com salvaguardas |
| 5 | Audit log e cadeia de custódia | 6 | Conformidade e auditoria | Identificação do auditor + ação | Servidores municipais | Art. 7º, II | Não (interno) | 5 anos mínimo | Não | Append-only, criptografado |
| 6 | Copilot Fiscal (RAG sobre legislação) | 7 | Suporte ao auditor | n/a (legislação é pública) | n/a | Art. 7º, III | LLM externo (OpenAI/Anthropic) com PII pseudonimizada | Conforme contrato | Possível (US) — avaliar | Pseudonimização obrigatória, sem dado identificável no prompt |
| 7 | Ambiente de simulação | 7 | Treinamento de auditores | Dados sintéticos / pseudonimizados | n/a | Art. 7º, III | Não | Indefinido | Não | Sem dados reais; auditável |

## Como adicionar nova operação

1. Identifique a finalidade específica.
2. Liste os dados envolvidos e classifique sensibilidade.
3. Identifique a base legal (LGPD art. 7º).
4. Defina retenção (respeitando art. 173 do CTN para tributário: 5 anos).
5. Se risco elevado, abra também um RIPD (template em `ripd-template.md`).
6. Revisão e aprovação pelo DPO antes de produção.
7. Atualize esta tabela.

## Revisão periódica

A cada 6 meses, conferir:

- Operações em produção que não estão no ROPA (gap → corrigir).
- Operações no ROPA que não estão mais ativas (sair → marcar histórico).
- Mudanças de provedores que afetam transferência internacional.
- Mudanças na retenção por novas obrigações legais.
