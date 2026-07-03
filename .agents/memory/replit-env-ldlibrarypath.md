---
name: Node/pnpm quebrado pelo LD_LIBRARY_PATH do replit.nix
description: Por que node/pnpm falham no repl e como contornar
---

# Sintoma

Qualquer chamada de `node`/`pnpm`/`next` no repl falha com:

- `libcrypto.so.3: version 'OPENSSL_3.2.0'/'OPENSSL_3.4.0' not found`
- `libstdc++.so.6: version 'CXXABI_1.3.15' not found (required by icu4c)`

# Causa

O `replit.nix` deste template define `env.LD_LIBRARY_PATH` apontando
para o `openssl-3.0.13` + `libstdc++` do gcc-13 do channel do Nix, que
sao **mais antigos** que os que o Node modular do Replit foi linkado.
`LD_LIBRARY_PATH` sobrescreve o `DT_RUNPATH` do binario do Node, entao
o Node carrega os libs errados e aborta.

# Workaround (o que usamos)

Editar `replit.nix`/`.replit` diretamente e bloqueado ("Direct edits
to replit.nix are not allowed") e nao ha ferramenta para desativar um
env var especifico do Nix. A solucao e limpar por processo:

```sh
env -u LD_LIBRARY_PATH <comando>
```

A workflow "Start application" ja usa esse prefixo. Qualquer
`pnpm install` / comando node manual no repl **precisa** ser prefixado
tambem.

# Verificacao

`env -u LD_LIBRARY_PATH node -v` → `v22.22.0` funciona; `node -v`
sozinho falha. Remover a var basta — nada do lado node precisa das
libs do channel.

# Onde aplicar

- Toda task de workflow no `.replit` que rode node/pnpm/next.
- Instrucoes manuais no shell do repl.
- **Nao** perca tempo tentando editar `replit.nix` direto.
