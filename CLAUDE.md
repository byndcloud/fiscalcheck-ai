# CLAUDE.md

Instruções específicas para **Claude Code** e **Replit Agent** atuando no FiscoCheck AI.

> Este arquivo **estende** [`AGENTS.md`](./AGENTS.md). Leia o `AGENTS.md` primeiro — ele contém os princípios não-negociáveis (human-in-the-loop, LGPD, RBAC, idioma).

---

## 1. Skills disponíveis

Skills do Claude Code ficam em [`.claude/skills/`](./.claude/skills/). Cada skill tem seu próprio `SKILL.md` com frontmatter (`name`, `description`).

Skills neste projeto:

| Pasta | `name` no frontmatter | Status | Foco |
|---|---|---|---|
| `frontend/` | `frontend` | Ativa | Next.js 15, Tailwind v4, shadcn/ui, TanStack Query, Zustand |
| `backend/` | `backend` | Ativa | FastAPI, SQLAlchemy 2.0, Polars (ETL), LangGraph (agentes), Alembic |
| `qa-test-strategist/` | `qa-test-strategist` | Ativa | Estratégia de testes; Vitest, pytest, golden tests fiscais, evals de LLM |
| `security-auditor/` | `security-auditor` | Ativa | Revisão LGPD, sigilo fiscal (art. 198 CTN), RBAC, cadeia de custódia |

**Como usar uma skill:** quando o usuário pedir uma tarefa que case com a `description` do `SKILL.md`, **leia o `SKILL.md` correspondente** e siga suas instruções. Cada skill tem em `references/00-fiscocheck-context.md` o contexto **obrigatório** do projeto — leia-o antes de qualquer outra referência da mesma skill.

---

## 2. Contexto do produto (resumo)

FiscoCheck AI = triagem fiscal agêntica para a Secretaria da Fazenda de Brusque/SC.

7 módulos, todos com decisão humana:

1. **Ingestão** — ETL multifonte (NFS-e, DIMP, ECD, DEFIS, PGDAS, cadastro mobiliário)
2. **Cruzamento** — declarado vs. NFS-e + graph analytics (entidades, sócios, endereços)
3. **IA Preditiva** — score de risco + redes + XAI + active learning
4. **Gestão da Fiscalização** — orquestrador, dossiê, multicanal cidadão (autorregularização)
5. **Monitoramento** — dashboards, alertas, relatórios gerenciais
6. **Segurança e Conformidade** — RBAC, MFA, cadeia de custódia, LGPD
7. **Suporte** — copilot fiscal (RAG), simulador, geofiscalização

Mapa pasta → módulo está em [`AGENTS.md` § 2.2](./AGENTS.md).

---

## 3. Arquivos e dados sensíveis

> **Antes de tocar nestes arquivos, pare e considere o impacto.**

- **`.env`**, **`*.local`**, **`secrets/`** — segredos; **nunca** ler/expor/commitar conteúdo.
- **`docs/compliance/*`** — base legal e procedimentos LGPD/sigilo fiscal; mudanças exigem revisão da `security-auditor` skill.
- **`docs/adr/*`** — decisões arquiteturais imutáveis após "Accepted". Use `Superseded` em vez de editar.
- **`apps/api/src/fiscocheck_api/modules/compliance/`** — código de auditoria, logs imutáveis, RBAC. Quebrar isto = quebrar a defensabilidade legal da plataforma.
- **`apps/api/alembic/versions/*`** — migrations já aplicadas em produção **nunca** são editadas; gere uma nova.

### Dados de contribuintes (CPF, CNPJ, valores, NFS-e)

- **Nunca** colar dados reais em prompts/issues/PRs.
- **Nunca** mandar para LLM externo sem pseudonimização.
- Use fixtures sintéticas em [`apps/api/tests/fixtures/`](./apps/api/tests/fixtures/).

---

## 4. Workflows típicos no Replit

```bash
pnpm dev                  # botão Run executa este workflow
pnpm web:dev              # apenas frontend
pnpm api:dev              # apenas backend
pnpm test                 # smoke tests dos dois apps
```

Variáveis sensíveis vão no **Secrets** do Replit (espelhando [`.env.example`](./.env.example)), nunca em arquivos commitados.

Detalhes em [`replit.md`](./replit.md).

---

## 5. Padrões de resposta esperados

Quando você gerar código:

1. **Justifique mudanças não-óbvias** com comentário sobre a *intenção*, não sobre o *o quê*.
2. **Cite o módulo** (1–7) que está sendo afetado, para rastreabilidade.
3. **Liste impactos LGPD/sigilo** se a mudança tocar dados de contribuinte.
4. **Sugira migration** sempre que alterar modelo SQLAlchemy.
5. **Sugira teste** sempre que adicionar regra fiscal nova.

Quando você gerar PR:

- Título: Conventional Commits (`feat(crossing): adicionar grafo de socios`).
- Descrição: contexto, mudanças, módulo afetado, checklist de testes, observações de compliance.

---

## 6. Limites operacionais

- **Não rodar `force push`** em `main` ou `develop`.
- **Não criar arquivo `LICENSE`** sem confirmação explícita do mantenedor — a definição de licenciamento será tratada em sprint dedicado.
- **Não desabilitar** Husky, commitlint, lint-staged ou checks de CI.
- **Não baixar/instalar** binários externos sem ADR.
- **Não modificar** `.env.example` para incluir valores reais.

---

## 7. Em caso de incerteza

- Pergunte ao usuário **antes** de adivinhar quando a decisão for jurídica, fiscal ou de privacidade.
- Use [`AskQuestion`] quando houver 2+ caminhos válidos com trade-offs distintos.
- Quando achar que um ADR está faltando, **proponha um** em vez de tomar a decisão silenciosamente.

---

## 8. Manutenção deste arquivo

Quando algo mudar de modo estruturalmente importante (novo módulo, nova ferramenta crítica, mudança de stack), atualize:

1. Este `CLAUDE.md`.
2. [`AGENTS.md`](./AGENTS.md) (se afetar princípios).
3. Skill correspondente em [`.claude/skills/`](./.claude/skills/).
4. ADR em [`docs/adr/`](./docs/adr/) para o registro auditável.
