---
name: FiscalCheck preview model
description: Como o app real (apps/web) e servido no preview do Replit
---

# Modelo

Este repo usa o modelo **classic webview workflow** do Replit (nao o
sistema de artifacts). O preview mostra o que a workflow marcada com
`outputType = "webview"` estiver servindo.

- A workflow "Start application" roda o Next.js dev server em
  `PORT=5000` com `outputType = "webview"`. O comando limpa
  `LD_LIBRARY_PATH` e seta `NEXT_PUBLIC_MSW_ENABLED=true` para que os
  mocks MSW no browser sustentem a UI **sem precisar da FastAPI**.
- O script `dev` de `apps/web` faz bind em `-H 0.0.0.0 -p ${PORT:-3000}`;
  a workflow passa `PORT=5000`. Isso e obrigatorio: sem `0.0.0.0` o
  Next.js so escuta em `localhost` e o proxy do Replit nao alcanca.
- [`apps/web/next.config.ts`](../../apps/web/next.config.ts) omite
  `X-Frame-Options: DENY` em dev (ele bloqueia o preview em iframe) e
  define `allowedDevOrigins` para o proxy `*.replit.dev` /
  `REPLIT_DEV_DOMAIN`. Em producao o `DENY` continua ativo.

## Por que assim

Sem esses ajustes o preview mostra "Cannot GET /", tela em branco ou
"blocked by X-Frame-Options". Uma unica workflow webview servindo o
Next.js em 5000, com MSW ligado e headers relaxados em dev, resolve.

## Como aplicar

- Para mudar o que aparece no preview, edite a task da workflow "Start
  application" no `.replit`.
- A FastAPI (`apps/api`) NAO e necessaria para o front renderizar no
  preview — o MSW cobre tudo.
- Se quiser web + api juntos (fora do preview), rode manualmente a
  workflow "Dev (web + api)".
