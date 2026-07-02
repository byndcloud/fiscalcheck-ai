# Contribuindo com o FiscalCheck AI

Obrigado pelo interesse. Este projeto trata dados fiscais sensíveis e tem requisitos elevados de qualidade e conformidade — por favor leia este guia antes de abrir o primeiro PR.

---

## Antes de começar

1. Leia [`AGENTS.md`](./AGENTS.md) — princípios não-negociáveis (human-in-the-loop, LGPD, RBAC, idioma).
2. Leia o [`README.md`](./README.md) para entender a stack e rodar o projeto.
3. Veja o [`docs/architecture/overview.md`](./docs/architecture/overview.md) para a visão arquitetural.
4. Se sua mudança afeta dados de contribuintes, leia também [`docs/compliance/lgpd.md`](./docs/compliance/lgpd.md).

---

## Fluxo de branches

```text
develop      ←── branch default (integração contínua; PR + CI verde, self-merge ok)
    ├── feat/<curto-descritivo>
    ├── fix/<curto-descritivo>
    ├── chore/<curto-descritivo>
    └── docs/<curto-descritivo>
```

- **Nunca** comitar direto em `develop`. Sempre via PR.
- Branches de feature partem de `develop`.
- A branch `main` (releases) **ainda não existe no remoto** — será criada na primeira release, em janela controlada após validação. A partir daí, releases seguem `develop` → `main`.

---

## Convenção de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/) como **convenção recomendada**. No MVP não há validação automática (commitlint/Husky foram removidos para agilizar commits) — siga o padrão por disciplina; ele volta a ser obrigatório quando o time crescer.

```text
<tipo>(<escopo opcional>): <descrição imperativa>

[corpo opcional]

[rodapé opcional]
```

### Tipos aceitos

| Tipo | Uso |
| --- | --- |
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Mudança só de documentação |
| `style` | Formatação, sem alteração de lógica |
| `refactor` | Refatoração sem mudar comportamento |
| `perf` | Melhoria de performance |
| `test` | Adicionar/ajustar testes |
| `build` | Mudança em build/dependências |
| `ci` | Mudança em CI |
| `chore` | Manutenção sem efeito em código de produção |
| `revert` | Reverter commit anterior |

### Escopos sugeridos

`web`, `api`, `ingestion`, `crossing`, `ai`, `cases`, `analytics`, `compliance`, `support`, `auth`, `db`, `infra`, `docs`, `ci`.

### Exemplos

```text
feat(crossing): adicionar deteccao de subdeclarante via grafo
fix(auth): corrigir validacao de MFA expirada
docs(compliance): atualizar resumo de retencao LGPD
chore(deps): subir Next.js para 15.1.0
```

### Breaking changes

Use `!` após o tipo/escopo e/ou rodapé `BREAKING CHANGE:`:

```text
feat(api)!: trocar schema de score de risco

BREAKING CHANGE: campo `riskScore.factors` agora é `riskScore.explainers`
```

---

## Padrão de PR

### Título

Mesmo formato do commit principal.

### Descrição

Use o [template de PR](./.github/pull_request_template.md). Cobertura mínima:

- **Contexto**: que problema resolve?
- **Mudanças**: o que foi feito?
- **Módulo(s) afetado(s)**: 1, 2, … 7 ou "transversal".
- **Impactos LGPD/sigilo**: se houver, descrever.
- **Como testar**: passos para validar manualmente.
- **Checklist**: lint, typecheck, build, testes locais.

### Tamanho

PRs pequenos (< 400 linhas) são aceitos rapidamente. Acima disso, justifique ou divida.

---

## Antes de pedir review

```powershell
pnpm lint           # Biome + Ruff
pnpm typecheck      # tsc + pyright
pnpm test           # Vitest + pytest
pnpm build          # apenas se mudou apps/web
```

A CI vai rodar isso de novo, mas falhar local é mais rápido.

> Não há hooks de pre-commit no MVP — a validação é sua responsabilidade local + CI no PR.

---

## Code review

- PR para `develop`: 0 ou 1 reviewer (self-merge aceito após CI verde).
- PR para `main` (quando existir): 1 reviewer mínimo + todos os checks de CI obrigatórios.
- PRs que mexem em `docs/compliance/` ou `apps/api/.../compliance/` exigem revisão humana com foco em segurança/LGPD.

---

## Como adicionar uma dependência

### TypeScript

```powershell
pnpm --filter @fiscalcheck/web add <pacote>
pnpm --filter @fiscalcheck/web add -D <pacote>
```

### Python

```powershell
cd apps/api
uv add <pacote>
uv add --dev <pacote>
```

> Para dependências pesadas (> 50MB) ou que adicionam superfície de ataque relevante, **abra um ADR** em `docs/adr/` antes.

---

## Como adicionar um módulo / agente novo

1. Abra um ADR em `docs/adr/` explicando o porquê.
2. Crie a pasta em `apps/api/src/fiscalcheck_api/modules/<nome>/` com `__init__.py`, `router.py`, `schemas.py`, `service.py`, `models.py`, `repository.py`.
3. Registre o router em `apps/api/src/fiscalcheck_api/main.py`.
4. Gere migration: `uv run alembic revision --autogenerate -m "add <nome>"`.
5. Adicione doc do módulo em `docs/modules/`.
6. Adicione testes em `apps/api/tests/<nome>/`.

---

## Reportar vulnerabilidade

**Não** abra issue pública. Veja [`SECURITY.md`](./SECURITY.md).

---

Obrigado por contribuir com responsabilidade.
