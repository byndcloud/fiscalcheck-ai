/**
 * Conventional Commits — config compartilhada para o monorepo FiscoCheck AI.
 *
 * Mais detalhes em CONTRIBUTING.md.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "scope-enum": [
      1,
      "always",
      [
        "web",
        "api",
        "ingestion",
        "crossing",
        "ai",
        "cases",
        "analytics",
        "compliance",
        "support",
        "auth",
        "db",
        "infra",
        "docs",
        "ci",
        "deps",
        "release",
      ],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
  },
};
