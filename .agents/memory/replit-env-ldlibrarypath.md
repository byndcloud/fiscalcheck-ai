---
name: Node/pnpm broken by replit.nix LD_LIBRARY_PATH
description: Why every node/pnpm invocation fails in this repl and the workaround
---

# Symptom
Any `node`/`pnpm`/`next` call fails with errors like:
`libcrypto.so.3: version 'OPENSSL_3.2.0'/'OPENSSL_3.4.0' not found` and
`libstdc++.so.6: version 'CXXABI_1.3.15' not found (required by icu4c)`.

# Cause
`replit.nix` sets `env.LD_LIBRARY_PATH` pointing at the channel's
openssl-3.0.13 + gcc-13 libstdc++, which shadow the libs the module Node
was built against. LD_LIBRARY_PATH wins over Node's DT_RUNPATH, so Node
loads the wrong libcrypto/libstdc++ and aborts.

# Workaround (the fix we use)
Direct edits to `replit.nix`/`.replit` are blocked ("Direct edits ... are
not allowed"), and there is no tool to unset an arbitrary nix env var.
So clear it per-process instead:
`env -u LD_LIBRARY_PATH <cmd>`.
The "Start application" workflow command is prefixed this way, and every
manual `pnpm install` / node command must be too.

**Why:** verified `env -u LD_LIBRARY_PATH node -v` → v22.22.0 works, while
plain `node -v` fails. Removing the var is sufficient; nothing node-side
actually needs those channel libs.

**How to apply:** any time you run node/pnpm/next from bash or configure a
workflow, prefix with `env -u LD_LIBRARY_PATH`. Do not waste time trying to
edit replit.nix directly.
