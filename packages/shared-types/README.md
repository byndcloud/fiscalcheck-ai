# @fiscalcheck/shared-types

Tipos TS compartilhados, **gerados** do schema OpenAPI da API.

> NUNCA edite `src/openapi.d.ts` à mão. Se você precisa de um tipo novo, adicione o endpoint no FastAPI e regenere.

## Regenerar

```powershell
# 1. Suba a API
pnpm api:dev

# 2. Em outro shell, gere os tipos
pnpm --filter @fiscalcheck/shared-types generate
```

Os tipos gerados ficam em `src/openapi.d.ts`. Importe em `apps/web` como:

```ts
import type { components, paths } from "@fiscalcheck/shared-types";

type Auditor = components["schemas"]["Auditor"];
type ListCasesResponse = paths["/cases"]["get"]["responses"]["200"]["content"]["application/json"];
```

Tipos manuais (não-OpenAPI) podem ser exportados de `src/index.ts`, mas evite duplicar o que já vem da API.
