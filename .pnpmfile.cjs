/**
 * Hook do pnpm que remove, apenas no Replit em contexto de dev/preview,
 * as devDependencies de teste do `@fiscalcheck/web` cujo download e
 * bloqueado pelo package-firewall do Replit (ver
 * .agents/memory/fiscalcheck-firewall-test-deps.md e
 * docs/adr/0003-preview-replit.md).
 *
 * Fora do Replit (dev local, CI, deployment do Replit) o hook e no-op:
 * o `package.json` original passa intacto e o lockfile committado bate.
 *
 * Gate:
 *   - `REPL_ID` presente     -> estamos rodando dentro de um repl.
 *   - `REPLIT_DEPLOYMENT !== "1"` -> nao e build de deployment (que
 *     usa --frozen-lockfile e precisa do package.json original).
 *
 * Efeitos colaterais para o dev do Replit:
 *   - `pnpm install --frozen-lockfile` VAI falhar no dev preview do
 *     Replit porque o lockfile continua listando as deps removidas.
 *     Use `pnpm install` (sem --frozen-lockfile) no repl.
 *   - Rodar `pnpm --filter @fiscalcheck/web test` no repl vai falhar
 *     porque vitest nao esta instalado. Isso e esperado; os testes
 *     rodam no CI, nao no repl.
 */

const PACKAGES_TO_STRIP = [
  "vitest",
  "@vitejs/plugin-react",
  "@testing-library/jest-dom",
  "@testing-library/react",
  "jsdom",
];

function isReplitDevContext() {
  const inRepl = Boolean(process.env.REPL_ID);
  const isDeployment = process.env.REPLIT_DEPLOYMENT === "1";
  return inRepl && !isDeployment;
}

function readPackage(pkg, context) {
  if (pkg.name !== "@fiscalcheck/web") return pkg;
  if (!isReplitDevContext()) return pkg;
  if (!pkg.devDependencies) return pkg;

  const removed = [];
  for (const dep of PACKAGES_TO_STRIP) {
    if (pkg.devDependencies[dep]) {
      delete pkg.devDependencies[dep];
      removed.push(dep);
    }
  }

  if (removed.length && context && typeof context.log === "function") {
    context.log(
      `[.pnpmfile.cjs] Replit dev detectado; removidas do @fiscalcheck/web: ${removed.join(", ")}. ` +
        "Rode `pnpm install` (sem --frozen-lockfile) e nao espere `pnpm test` funcionar no repl.",
    );
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
