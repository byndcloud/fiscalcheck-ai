# Política de Segurança

O FiscoCheck AI processa **dados fiscais e identificáveis** protegidos pelo sigilo fiscal (art. 198 do CTN) e pela LGPD (Lei nº 13.709/2018). Levamos vulnerabilidades a sério.

---

## Versões com suporte

O projeto está em **fase de piloto**. Apenas a `main` recebe correções de segurança.

| Versão | Suporte |
|---|---|
| `main` | Ativo |
| Outras branches | Sem suporte |

---

## Como reportar uma vulnerabilidade

### NÃO abra issue pública.

Em vez disso:

1. Envie e-mail para **security@beyond-aurora.com.br** (ajustar quando o canal oficial estiver definido).
2. Inclua, se possível:
   - Descrição do impacto.
   - Passos para reproduzir.
   - Versão/commit afetado.
   - Proof-of-concept (sem usar dados reais de contribuintes).
   - Sugestão de mitigação (opcional).
3. Aguarde confirmação em até **48 horas úteis**.

Você também pode usar o **[Private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)** do GitHub.

---

## Compromissos de resposta

| Etapa | Prazo |
|---|---|
| Confirmação de recebimento | 48h úteis |
| Avaliação inicial e classificação de severidade | 5 dias úteis |
| Patch ou mitigação | Conforme severidade (ver tabela abaixo) |
| Comunicação ao reportante | Contínua até a correção |
| Notificação à ANPD (se houver vazamento de dado pessoal) | **≤ 24 horas** após confirmação (conforme [`docs/compliance/runbook-incidente-24h.md`](./docs/compliance/runbook-incidente-24h.md)) |

### Classificação de severidade

| Severidade | Exemplos | Prazo de correção |
|---|---|---|
| **Crítica** | Vazamento de CPF/CNPJ/valor; bypass de RBAC; RCE | ≤ 7 dias |
| **Alta** | Privilege escalation; SQL injection sem PII; XSS persistente | ≤ 30 dias |
| **Média** | XSS refletido; CSRF; SSRF limitado | ≤ 60 dias |
| **Baixa** | Information disclosure não-sensível; falhas de hardening | ≤ 90 dias |

---

## Escopo

**Em escopo:**

- Código em `apps/`, `packages/`, `infra/`.
- Configurações de CI (`.github/`), Replit (`.replit`, `replit.nix`), Docker (`infra/`).
- Dependências diretas.

**Fora de escopo:**

- Serviços de terceiros (OpenAI, Replit, GitHub).
- Engenharia social.
- DoS sem PoC de impacto.
- Auto-XSS ou outros que exigem que a vítima atue contra si.

---

## Programa de divulgação responsável

Não temos bug bounty no momento (fase de piloto). Reportes legítimos serão:

- Reconhecidos publicamente após o patch (com consentimento).
- Listados em `docs/security/hall-of-fame.md` (a criar).

---

## Boas práticas observadas pelo projeto

- **Criptografia**: TLS 1.2+ em trânsito; AES-256 em repouso.
- **Autenticação**: MFA obrigatório para `auditor`, `supervisor`, `admin`.
- **Autorização**: RBAC com mínimo privilégio.
- **Auditoria**: logs imutáveis (append-only) de toda ação com efeito sobre contribuinte.
- **LGPD**: pseudonimização antes de treino de modelos; resposta a incidente ≤ 24h.
- **Dependências**: Dependabot semanal + `pnpm audit` + `pip-audit` no CI.
- **Análise estática**: CodeQL semanal.
- **Secret scanning**: GitHub Secret Scanning + Push Protection habilitados.

---

## Contato alternativo

Se o e-mail acima não estiver acessível, contate qualquer mantenedor listado em [`.github/CODEOWNERS`](./.github/CODEOWNERS) via canal privado.
