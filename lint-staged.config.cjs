/**
 * lint-staged — só roda lint nos arquivos staged, no pre-commit.
 * Husky chama isto via .husky/pre-commit.
 */
module.exports = {
  "*.{js,jsx,ts,tsx,json,jsonc}": ["pnpm exec biome check --write --no-errors-on-unmatched"],
  "*.{md,mdx}": ["pnpm exec markdownlint --fix --ignore '**/node_modules/**' --ignore '**/.next/**'"],
  "apps/api/**/*.py": [
    "pnpm --filter @fiscocheck/api exec ruff check --fix",
    "pnpm --filter @fiscocheck/api exec ruff format",
  ],
};
