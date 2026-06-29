# @fiscocheck/tsconfig

Configs TypeScript compartilhadas para o monorepo.

| Config | Uso |
|---|---|
| `base.json` | Base estrita para qualquer pacote TS |
| `nextjs.json` | Estende `base.json` com config específica de Next.js |

## Como usar

```jsonc
// apps/web/tsconfig.json
{
  "extends": "@fiscocheck/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```
