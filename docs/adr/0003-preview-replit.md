# ADR-0003: Estratégia de preview no Replit — webview web-only com MSW

- **Status:** Proposed
- **Data:** 2026-07-03
- **Autor(es):** @owner-tech-lead
- **Revisores:** @owner-architect, @owner-frontend
- **Relacionado:** [ADR-0002](./0002-database-mvp-replit.md) (define o Replit como host do MVP)

---

## Contexto

O MVP roda no Replit ([ADR-0002](./0002-database-mvp-replit.md)) mas a "preview do Replit" (a aba de webview que aparece ao lado do editor) tinha três problemas que impediam o app de carregar visualmente:

1. **`Cannot GET /` / preview em branco.** O `runButton` original apontava para uma workflow `Dev (web + api)` que roda dois processos em paralelo mas nenhum é marcado como `webview`. O Replit não sabia qual porta expor no iframe do preview.

2. **`X-Frame-Options: DENY` bloqueando o iframe.** [`apps/web/next.config.ts`](../../apps/web/next.config.ts) enviava `X-Frame-Options: DENY` em todas as rotas — corretíssimo em produção, mas o preview do Replit **é** um iframe cross-origin (`*.replit.dev`), então o browser bloqueava o load.

3. **`Invalid Host header` / assets 404 do HMR.** Next.js valida a origem do HMR/dev assets contra `allowedDevOrigins`. Sem entrada para `*.replit.dev` / `REPLIT_DEV_DOMAIN`, o dev server rejeitava as requisições do iframe.

4. **`libcrypto.so.3 / OPENSSL_3.2.0 not found` ao rodar `pnpm`.** O `replit.nix` deste template define `env.LD_LIBRARY_PATH` apontando para bibliotecas do channel Nix (openssl-3.0.13 + libstdc++ do gcc-13) que são incompatíveis com o Node modular do Replit. `LD_LIBRARY_PATH` vence o `DT_RUNPATH` do binário, e o Node aborta antes de qualquer comando. Editar `replit.nix` diretamente é bloqueado ("Direct edits to replit.nix are not allowed").

5. **FastAPI não sobe confiavelmente na preview.** Sem `DATABASE_URL` populado corretamente e com o Postgres gerenciado do Replit demorando a inicializar no cold start, a API frequentemente falha nos primeiros segundos — período em que o auditor tenta ver a preview.

6. **`ERR_PNPM_FETCH_403` em `vitest-2.1.9.tgz`.** O firewall de pacotes do Replit (`package-firewall.replit.local`) bloqueia parte do toolchain de teste. Um workaround anterior removeu `vitest` + `@testing-library/*` + `jsdom` + `@vitejs/plugin-react` do `apps/web/package.json` — que quebra o job `web` do CI e apaga a possibilidade de rodar os 13 testes em `apps/web/tests/`.

## Decisão

**No preview do Replit, servimos apenas o Next.js (`apps/web`) com a camada de mock MSW ligada, na porta 5000, com `LD_LIBRARY_PATH` limpo por processo. A FastAPI só sobe sob demanda em workflows manuais. As devDependencies de teste são preservadas — o 403 do firewall será resolvido via mirror do Replit, não removendo pacotes.**

### Implicações concretas

1. **Workflow default do Run button.** [`.replit`](../../.replit) define `runButton = "Project"` → workflow `Project` (parallel) → workflow `Start application`:

   ```
   env -u LD_LIBRARY_PATH PORT=5000 NEXT_PUBLIC_MSW_ENABLED=true \
     pnpm --filter @fiscalcheck/web dev
   ```

   com `waitForPort = 5000` e `[workflows.workflow.metadata] outputType = "webview"`.

2. **Bind e porta dinâmicos.** [`apps/web/package.json`](../../apps/web/package.json) usa `next dev --turbo -H 0.0.0.0 -p ${PORT:-3000}` (e o equivalente no `start`). Sem `-H 0.0.0.0` o Next só escuta em `localhost` e o proxy do Replit não alcança; sem `${PORT:-3000}` a workflow do webview (que passa `PORT=5000`) seria ignorada.

3. **Headers condicionais.** [`apps/web/next.config.ts`](../../apps/web/next.config.ts) mantém todos os headers de segurança em produção, mas **omite `X-Frame-Options: DENY` em dev**. `Content-Security-Policy` / `frame-ancestors` também não são configurados em dev para permitir o iframe. Em produção o `DENY` volta ativo.

4. **`allowedDevOrigins` cobre o proxy do Replit.** `REPLIT_DEV_DOMAIN`, `*.replit.dev`, `*.repl.co`, `*.worf.replit.dev` são whitelisted apenas para dev.

5. **MSW é o backend do preview.** O ambiente do preview é intencionalmente uma **demo sem side-effects**: `NEXT_PUBLIC_MSW_ENABLED=true` faz [`apps/web/mocks/enable.ts`](../../apps/web/mocks/enable.ts) subir o worker MSW no browser, interceptando as chamadas HTTP e devolvendo dados sintéticos. Quem quiser web + API reais no repl usa a workflow `Dev (web + api)` manualmente.

6. **Portas expostas no Replit** (`[[ports]]`):
   - `5000 → 5000` (Next.js webview do preview).
   - `8080 → 80` (fallback HTTPS externo do webview).
   - `23345 → 3000` (mapping legado para quando alguém roda o Next.js na porta padrão 3000 manualmente).
   - `8000 → 8000` (FastAPI quando rodada manualmente).
   - **Removido**: `3000 → 80`. Antes existia junto com `8080 → 80`, o que causa conflito de porta externa. Como o preview canônico usa `5000` e o mapping legado `3000` sai via `23345 → 3000`, o `3000 → 80` deixa de ser necessário.

7. **Workaround do `LD_LIBRARY_PATH`.** Todo comando `node`/`pnpm`/`next` invocado no repl (workflows ou shell manual) precisa ser prefixado com `env -u LD_LIBRARY_PATH`. A workflow `Start application` já faz isso; qualquer nova workflow que rode Node **precisa** herdar esse prefixo.

8. **Deps de teste do web permanecem no `package.json`.** Removê-las para desbloquear `pnpm install` no repl **não** é opção porque:
   - `.github/workflows/ci.yml` roda `pnpm --filter @fiscalcheck/web test`.
   - Existem 13 arquivos em `apps/web/tests/` (T13/T15 etc.) que dependem do toolchain.

   O desbloqueio do 403 é feito via mirror/allowlist do Replit (config do repl / admin da org), **não** via alteração de código.

### Documentação para agentes

Este ADR é a "verdade formal". Para consulta rápida em runtime, agentes têm três notas curtas em `.agents/memory/`:

- `fiscalcheck-preview-model.md` — resumo operacional do que este ADR decide.
- `replit-env-ldlibrarypath.md` — o workaround do `LD_LIBRARY_PATH`.
- `fiscalcheck-firewall-test-deps.md` — por que não removemos vitest.

## Consequências

### Positivas

- **Preview funciona de forma determinística.** Um único caminho testado (`Project` → `Start application` → webview em 5000) leva do Run button até o login renderizado.
- **Demos rápidas do MVP.** Como o preview só depende do Next.js + MSW, não há espera de cold start do Postgres nem da FastAPI. Um stakeholder abre o repl e vê a UI em segundos.
- **CI intacto.** Nada muda no toolchain de teste; o job `web` continua com vitest + testing-library.
- **Produção segura.** `X-Frame-Options: DENY` e demais headers só são relaxados quando `NODE_ENV !== "production"`.
- **Rastreabilidade.** ADR + `.agents/memory/` + comentários no `.replit` explicam o "porquê" de cada gambiarra.

### Negativas / trade-offs

- **Preview não exercita a FastAPI.** Bugs no backend só aparecem se alguém rodar a workflow `Dev (web + api)` manualmente. Mitigação: golden tests de agentes e endpoints continuam no CI e em `apps/api/tests/`.
- **MSW no dev pode divergir do backend real.** Handlers em `apps/web/mocks/` precisam refletir os schemas de `@fiscalcheck/shared-types`. Mitigação: quando a geração OpenAPI for ativada (mencionada em AGENTS.md § 4.1), os handlers passam a ser validados contra os tipos gerados.
- **`pnpm install` no repl pode 403.** O firewall pode bloquear vitest a qualquer momento. Mitigação: nota `.agents/memory/fiscalcheck-firewall-test-deps.md` documenta o unblock via mirror. Enquanto isso, o repl reutiliza o `node_modules` já instalado.
- **Duas workflows para lembrar** (`Project` = preview, `Dev (web + api)` = dev completo). O time precisa saber a diferença. Mitigação: comentário no `.replit` explica.

### Riscos

- **`LD_LIBRARY_PATH` pode voltar a atrapalhar** se um novo template do Replit for aplicado por engano ou se alguém rodar uma workflow sem o prefixo. Mitigação: comentário explícito no `.replit` + nota `.agents/memory/replit-env-ldlibrarypath.md`.
- **Confusão entre preview e produção.** Um dev pode achar que "está funcionando" no preview e esquecer que a FastAPI não subiu. Mitigação: banner visual no header quando `NEXT_PUBLIC_MSW_ENABLED=true` (implementação futura em [`apps/web/components/`](../../apps/web/components/)).
- **Portas externas podem ser reclamadas pelo Replit** caso a política do provedor mude. Mitigação: mapping documentado aqui — se o Replit exigir outra porta canônica, mudar em um lugar (`.replit`) e atualizar este ADR.

## Alternativas consideradas

### A. Rodar `Dev (web + api)` como preview (parallel: web + api)

- **A favor**: preview usa a stack real, sem MSW.
- **Contra**: (1) o Replit só serve um `outputType = "webview"` por workflow; teria que escolher um dos dois processos como visível; (2) cold start da FastAPI + Postgres deixa o preview em erro por 15-30s; (3) o firewall pode 403 durante o `pnpm install` da API também. **Rejeitada** — quebra a promessa de "clicar Run e ver a UI".

### B. Espelhar b-replit inteiro na develop (incluindo remoção das deps de teste)

- **A favor**: o mais próximo do que já foi testado no repl.
- **Contra**: apaga a suite de testes do web e quebra o job `web` do CI. **Rejeitada** — o custo de perder CI é maior que o benefício de "um install a menos".

### C. Move devDeps de teste para um workspace separado (`packages/web-tests`)

- **A favor**: `pnpm install --filter='!@fiscalcheck/web-tests'` no repl pularia o toolchain problemático.
- **Contra**: refactor não-trivial (imports de `msw`, setup do vitest, tsconfig etc.); benefício marginal se o mirror do Replit for configurado. **Adiada** — considerar se o 403 do firewall se tornar bloqueante e o mirror não for viável em prazo curto.

### D. Servir um build estático do Next.js como preview

- **A favor**: sem dev server no repl, sem `LD_LIBRARY_PATH`, sem HMR.
- **Contra**: perdemos hot reload (chave para demos iterativas); `next build` no repl também precisaria do toolchain de teste no `pnpm install`. **Rejeitada**.

## Como reverter

Se decidirmos que o preview deve exercitar o stack completo:

1. Trocar o comando da workflow `Start application` para rodar `pnpm --filter @fiscalcheck/api dev` em paralelo (nova task) e apontar `outputType = "webview"` para o processo que atende `/`.
2. Remover `NEXT_PUBLIC_MSW_ENABLED=true` da workflow.
3. Popular `DATABASE_URL` no `[env]` do `.replit` (via Secrets do Replit).
4. Aceitar 15-30s de cold start no primeiro Run.

## Relação com ADR-0001 e ADR-0002

- Não altera nenhuma decisão de [ADR-0001](./0001-stack-inicial.md) (stack) ou [ADR-0002](./0002-database-mvp-replit.md) (banco).
- Complementa ADR-0002 explicando **como** o app efetivamente aparece no preview do Replit, dado o host escolhido lá.

## Referências

- [Next.js — `allowedDevOrigins`](https://nextjs.org/docs/app/api-reference/next-config-js/allowedDevOrigins)
- [Next.js — Custom Headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Replit docs — Configuring Workflows](https://docs.replit.com/replit-workspace/configuring-repl)
- [Replit docs — Ports](https://docs.replit.com/programming-ide/workspace-features/ports)
- [MSW — Getting started](https://mswjs.io/docs/getting-started)
- PR [#44](https://github.com/byndcloud/fiscalcheck-ai/pull/44) — implementação inicial dos workarounds.
- Branch histórica `b-replit` — validação original dos ajustes no ambiente Replit.
